import {Component, computed, input, InputSignal, Signal, signal, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Athlete} from '../../../../types/Athlete';
import {CountryForm, CountryStats, FormCountryPayload, V2Country} from '../../../../types/Country';
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

    const hasTranslations: boolean = !!(country.nameEn || country.nameDe || country.nameFr);
    return {
      countryCode: country.countryCode,
      countryName: hasTranslations ? (country.nameEn ?? country.countryName) : country.countryName,
      goldMedals: country.medals.gold, silverMedals: country.medals.silver, bronzeMedals: country.medals.bronze,
      translate: hasTranslations, nameDe: country.nameDe ?? '', nameFr: country.nameFr ?? '',
    };
  });

  /**
   * Filtered and sorted list of countries based on current filter and search criteria.
   * Also includes countries where at least one athlete matches the search query.
   */
  protected filteredCountries: Signal<CountryStats[]> = computed((): CountryStats[] => {
    const query: string = this.searchQuery().toLowerCase();

    return this.dataService.countriesData()
      .filter(country => {
        const matchesCountryFilter: boolean =
          this.filterCountry() === 'all' || country.countryName === this.filterCountry();
        if (!matchesCountryFilter) return false;

        const matchesCountrySearch: boolean = country.countryName.toLowerCase().includes(query);
        if (matchesCountrySearch) return true;

        // Also include the country if any of its athletes match the search query
        return this.dataService.athletes().some(
          a => a.countryId === country.countryId && a.name.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => sortByMedals(a, b, a.countryName, b.countryName, this.filterMedal()));
  });

  /**
   * Returns athletes belonging to a given country, filtered by the current search query
   * (only when the search does not match the country name itself) and sorted by total medals descending.
   *
   * @param {number} countryId - The ID of the country.
   * @returns {Athlete[]} Filtered and sorted athletes.
   */
  protected athletesForCountry(countryId: number): Athlete[] {
    const query: string = this.searchQuery().toLowerCase();
    const country: CountryStats | undefined = this.dataService.countriesData()
      .find(c => c.countryId === countryId);

    // If the search matches the country name (or is empty), show all athletes of this country
    const countryMatchesSearch: boolean = !query || (!!country && country.countryName.toLowerCase().includes(query));

    return this.dataService.athletes()
      .filter(a => {
        if (a.countryId !== countryId) return false;

        // Only filter athletes by name when the country itself doesn't match the search
        if (!countryMatchesSearch) return a.name.toLowerCase().includes(query);
        return true;
      })
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
   * Auto-expands when an active search query matches an athlete (but not the country name).
   *
   * @param {number} countryId - The ID of the country to check.
   * @returns {boolean} True if the row is expanded.
   */
  protected isCountryExpanded(countryId: number): boolean {
    if (this.expandedCountries().has(countryId)) return true;

    const query: string = this.searchQuery().toLowerCase();
    if (!query) return false;

    const country: CountryStats | undefined = this.dataService.countriesData()
      .find(c => c.countryId === countryId);
    const countryMatchesSearch: boolean = !!country && country.countryName.toLowerCase().includes(query);

    // Auto-expand if search matches an athlete but not the country name
    return !countryMatchesSearch && this.dataService.athletes()
      .some(a => a.countryId === countryId && a.name.toLowerCase().includes(query));
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
        // update all lists
        this.dataService.countriesData.update(current => current.filter(c => c.countryId !== countryId));
        this.dataService.athletes.update(current => current.filter(a => a.countryId !== countryId));
        this.dataService.sports.update(current => current.map(s => ({
          ...s, participants: s.participants.filter(p => p.countryId !== countryId)
        })));

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
    const payload: FormCountryPayload = form.translate
      ? { code: form.countryCode.toUpperCase(), name: form.countryName, nameEn: form.countryName, nameDe: form.nameDe, nameFr: form.nameFr }
      : { code: form.countryCode.toUpperCase(), name: form.countryName };

    this.countryService.createCountry(payload).subscribe({
      next: (created: V2Country): void => {
        const lang: string = this.translateService.getCurrentLang();
        const displayName: string = lang === 'de' ? (created.nameDe || created.name) :
                                    lang === 'fr' ? (created.nameFr || created.name) :
                                                    (created.nameEn || created.name);

        const newCountry: CountryStats = { countryId: created.id,  countryCode: created.code, countryName: displayName,
                                           medals: { gold: 0, silver: 0, bronze: 0 }, nameEn: created.nameEn,
                                           nameDe: created.nameDe, nameFr: created.nameFr };

        this.dataService.countriesData.update(current => [...current, newCountry]);
        this.isCountryModalOpen.set(false);
        this.alertService.success(
          this.translateService.instant('ALERT.COUNTRY.ADD').replace('[name]', displayName));
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

    const payload: any = form.translate
      ? { code: form.countryCode, name: form.countryName, nameEn: form.countryName, nameDe: form.nameDe, nameFr: form.nameFr }
      : { code: form.countryCode, name: form.countryName, nameEn: null, nameDe: null, nameFr: null };

    const newCode: string = form.countryCode.toUpperCase();
    const lang: string = this.translateService.getCurrentLang();
    this.countryService.updateCountry(country.countryId, payload).subscribe({
      next: (): void => {
        const displayName: string = form.translate ? (lang === 'de' ? (form.nameDe ?? form.countryName)
                                                   : lang === 'fr' ? (form.nameFr ?? form.countryName)
                                                   : form.countryName) : form.countryName;

        // update all lists
        this.dataService.countriesData.update(current =>
          current.map(c => c.countryId !== country.countryId ? c : {
            ...c, countryCode: newCode, countryName: displayName,
            nameEn:  form.translate ? form.countryName              : undefined,
            nameDe:  form.translate ? (form.nameDe  ?? undefined)   : undefined,
            nameFr:  form.translate ? (form.nameFr  ?? undefined)   : undefined })
        );
        this.dataService.athletes.update(current =>
          current.map(a => a.countryId !== country.countryId ? a
            : { ...a, countryCode: newCode, countryName: displayName })
        );
        this.dataService.sports.update(current => current.map(s => ({
          ...s, participants: s.participants.map(p => p.countryId !== country.countryId ? p
            : { ...p, countryCode: newCode, countryName: displayName })
        })));

        this.editingCountry.set(null);
        this.isCountryModalOpen.set(false);
        this.alertService.success(
          this.translateService.instant('ALERT.COUNTRY.EDIT').replace('[name]', displayName));
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



