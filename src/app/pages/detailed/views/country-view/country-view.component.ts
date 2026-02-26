import {Component, computed, input, InputSignal, Signal, signal, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Athlete} from '../../../../types/Athlete';
import {CountryForm, CountryStats} from '../../../../types/Country';
import {TableCountryBadgeComponent} from '../../../../layout/elements/table-country-badge/table-country-badge.component';
import {TableMedalPillsComponent} from '../../../../layout/elements/table-medal-pills/table-medal-pills.component';
import {TableActionsComponent} from '../../../../layout/elements/table-actions/table-actions.component';
import {ModalCountryComponent} from '../../../../layout/sections/modal/modal-country/modal-country.component';
import {AlertService} from '../../../../services/api/alert/alert.service';
import {AuthService} from '../../../../services/api/auth/auth.service';
import {CountryService} from '../../../../services/api/country/country.service';
import {DataHolderService} from '../../../../services/data-holder/data-holder.service';
import {sortByMedals} from '../../utils/medal-sort.util';

@Component({
  selector: 'app-country-view',
  imports: [
    NgOptimizedImage,
    TranslatePipe,
    TableCountryBadgeComponent,
    TableMedalPillsComponent,
    TableActionsComponent,
    ModalCountryComponent,
  ],
  templateUrl: './country-view.component.html',
  styleUrl: './country-view.component.css',
})
export class CountryViewComponent {
  filterCountry: InputSignal<string> = input.required<string>();
  filterMedal: InputSignal<'all' | 'gold' | 'silver' | 'bronze'> = input.required<'all' | 'gold' | 'silver' | 'bronze'>();
  searchQuery: InputSignal<string> = input.required<string>();

  protected isCountryModalOpen: WritableSignal<boolean> = signal(false);
  protected editingCountry: WritableSignal<CountryStats | null> = signal(null);
  /** Tracks which country rows are currently expanded (by countryId). */
  protected expandedCountries: WritableSignal<Set<number>> = signal(new Set<number>());

  constructor(protected dataService: DataHolderService, protected authService: AuthService,
              private alertService: AlertService, private countryService: CountryService,
              private translateService: TranslateService) {}

  /**
   * Computed signal that transforms the currently selected country into a `CountryForm` model.
   */
  protected countryEditData: Signal<CountryForm | null> = computed((): CountryForm | null => {
    const country: CountryStats | null = this.editingCountry();
    if (!country) return null;

    return {countryCode: country.countryCode, countryName: country.countryName,
            goldMedals: country.medals.gold, silverMedals: country.medals.silver, bronzeMedals: country.medals.bronze};
  });

  /**
   * Filtered and sorted list of countries based on current filter and search criteria.
   */
  protected filteredCountries: Signal<CountryStats[]> = computed((): CountryStats[] => {
    return this.dataService.countriesData()
      .filter(country => {
        const matchesSearch: boolean = country.countryName.toLowerCase()
          .includes(this.searchQuery().toLowerCase());
        const matchesCountryFilter: boolean =
          this.filterCountry() === 'all' || country.countryName === this.filterCountry();
        return matchesSearch && matchesCountryFilter;
      })
      .sort((a, b) => sortByMedals(a, b, a.countryName, b.countryName, this.filterMedal()));
  });

  /**
   * Returns athletes belonging to a given country, sorted by total medals descending.
   *
   * @param {number} countryId - The ID of the country.
   * @returns {Athlete[]} Filtered and sorted athletes.
   */
  protected athletesForCountry(countryId: number): Athlete[] {
    return this.dataService.athletes()
      .filter(a => a.countryId === countryId)
      .sort((a, b): number => sortByMedals(a, b, a.name, b.name, this.filterMedal()));
  }

  /**
   * Toggles the expanded state of a country row.
   *
   * @param {number} countryId - The ID of the country to toggle.
   */
  protected toggleCountry(countryId: number): void {
    if (this.athletesForCountry(countryId).length <= 0) return;

    this.expandedCountries.update(set => {
      const next = new Set(set);
      next.has(countryId) ? next.delete(countryId) : next.add(countryId);
      return next;
    });
  }

  /**
   * Returns whether a country row is currently expanded.
   *
   * @param {number} countryId - The ID of the country to check.
   * @returns {boolean} True if the row is expanded.
   */
  protected isCountryExpanded(countryId: number): boolean {
    return this.expandedCountries().has(countryId);
  }

  /**
   * Opens the edit modal for the given country.
   *
   * @param {CountryStats} country - The country to edit.
   */
  protected onEditCountry(country: CountryStats): void {
    this.editingCountry.set(country);
    this.isCountryModalOpen.set(true);
  }

  /**
   * Deletes a country by its ID.
   *
   * @param {number} countryId - The ID of the country to delete.
   */
  protected onDeleteCountry(countryId: number): void {
    const country: CountryStats | undefined = this.dataService.countriesData().find(c => c.countryId === countryId);
    if (!country) return;

    this.countryService.deleteCountry(countryId).subscribe({
      next: (): void => {
        this.dataService.countriesData.update(current => current.filter(c => c.countryId !== countryId));
        this.dataService.athletes.update(current => current.filter(a => a.countryId !== countryId));
        this.alertService.success(
          this.translateService.instant('ALERT.COUNTRY.DELETE').replace('[name]', country.countryName));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error deleting country:', error);
        this.alertService.error(
          this.translateService.instant('ALERT.COUNTRY.DELETE.ERROR').replace('[name]', country.countryName));
      }
    });
  }

  /**
   * Handles adding a new country via the modal form.
   *
   * @param {CountryForm} form - The form data for the new country.
   */
  protected onAddCountry(form: CountryForm): void {
    this.countryService.createCountry({ code: form.countryCode.toUpperCase(), name: form.countryName }).subscribe({
      next: (): void => {
        this.dataService.load();
        this.isCountryModalOpen.set(false);
        this.alertService.success(
          this.translateService.instant('ALERT.COUNTRY.ADD').replace('[name]', form.countryName));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error creating country:', error);
        if (error.status !== 409) {
          this.alertService.error(
            this.translateService.instant('ALERT.COUNTRY.ADD.ERROR').replace('[name]', form.countryName));
        }
      }
    });
  }

  /**
   * Handles updating an existing country via the modal form.
   *
   * @param {CountryForm} form - The updated form data.
   */
  protected onUpdateCountry(form: CountryForm): void {
    const country: CountryStats | null = this.editingCountry();
    if (!country) return;

    this.countryService.updateCountry(country.countryId, { code: form.countryCode, name: form.countryName }).subscribe({
      next: (): void => {
        this.dataService.countriesData.update(current =>
          current.map(c => c.countryId === country.countryId
            ? { ...c, countryCode: form.countryCode, countryName: form.countryName,
                medals: { gold: form.goldMedals, silver: form.silverMedals, bronze: form.bronzeMedals } }
            : c)
        );
        this.dataService.athletes.update(current =>
          current.map(a => a.countryId === country.countryId
            ? { ...a, countryCode: form.countryCode.toUpperCase(), countryName: form.countryName }
            : a)
        );
        this.editingCountry.set(null);
        this.isCountryModalOpen.set(false);
        this.alertService.success(
          this.translateService.instant('ALERT.COUNTRY.EDIT').replace('[name]', form.countryName));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error updating country:', error);
        this.alertService.error(
          this.translateService.instant('ALERT.COUNTRY.EDIT.ERROR').replace('[name]', form.countryName));
      }
    });
  }

  /**
   * Closes the country modal and resets the editing state.
   */
  protected onCloseCountryModal(): void {
    this.isCountryModalOpen.set(false);
    this.editingCountry.set(null);
  }
}



