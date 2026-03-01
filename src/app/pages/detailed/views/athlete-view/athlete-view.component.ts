import {Component, computed, input, InputSignal, output, OutputEmitterRef, Signal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Athlete, AthleteForm} from '../../../../types/Athlete';
import {CountryStats, CountryForm} from '../../../../types/Country';
import {TableCountryBadgeComponent} from '../../../../layout/elements/table-country-badge/table-country-badge.component';
import {TableMedalPillsComponent} from '../../../../layout/elements/table-medal-pills/table-medal-pills.component';
import {TableActionsComponent} from '../../../../layout/elements/table-actions/table-actions.component';
import {ModalAthleteComponent} from '../../../../layout/sections/modal/modal-athlete/modal-athlete.component';
import {ModalCountryComponent} from '../../../../layout/sections/modal/modal-country/modal-country.component';
import {AlertService} from '../../../../services/api/alert/alert.service';
import {AuthService} from '../../../../services/api/auth/auth.service';
import {AthleteService} from '../../../../services/api/athlete/athlete.service';
import {CountryService} from '../../../../services/api/country/country.service';
import {DataHolderService} from '../../../../services/data-holder/data-holder.service';
import {signal, WritableSignal} from '@angular/core';
import {sortByMedals} from '../../utils/medal-sort.util';
import {AthleteResult, DISCIPLINE_RESULTS, DisciplineResult} from '../../../../types/Disciplines';

@Component({
  selector: 'app-athlete-view',
  imports: [
    NgOptimizedImage,
    TranslatePipe,
    TableCountryBadgeComponent,
    TableMedalPillsComponent,
    TableActionsComponent,
    ModalAthleteComponent,
    ModalCountryComponent,
  ],
  templateUrl: './athlete-view.component.html',
  styleUrl: './athlete-view.component.css',
})
export class AthleteViewComponent {
  filterCountry: InputSignal<string> = input.required<string>();
  filterSport: InputSignal<string> = input.required<string>();
  filterMedal: InputSignal<'all' | 'gold' | 'silver' | 'bronze'> = input.required<'all' | 'gold' | 'silver' | 'bronze'>();
  searchQuery: InputSignal<string> = input.required<string>();

  /** Emitted when the user wants to open the country creation modal from within the athlete form. */
  openCountryModal: OutputEmitterRef<AthleteForm> = output<AthleteForm>();

  /** Holds the suspended athlete form when the country modal is opened from within the athlete modal. */
  protected suspendedAthleteForm: WritableSignal<AthleteForm | null> = signal(null);
  protected isAthleteModalOpen: WritableSignal<boolean> = signal(false);
  protected isCountryModalOpen: WritableSignal<boolean> = signal(false);
  protected editingAthlete: WritableSignal<Athlete | null> = signal(null);
  protected expandedAthletes: WritableSignal<Set<number>> = signal(new Set<number>());

  constructor(protected dataService: DataHolderService, protected authService: AuthService,
              private alertService: AlertService, private athleteService: AthleteService,
              private countryService: CountryService, private translateService: TranslateService) {}

  /**
   * Computed signal that transforms the currently selected athlete into an `AthleteForm` model.
   */
  protected athleteEditData: Signal<AthleteForm | null> = computed((): AthleteForm | null => {
    const athlete: Athlete | null = this.editingAthlete();
    if (!athlete) return null;

    const rawBestTime: string = (athlete.bestTime || '')
      .replace(/\s*pts$/i, '')
      .replace(/\s*wins$/i, '')
      .replace(/\s*(Siege|Punkte|Victoires|Points)$/i, '')
      .trim();

    return {
      id: athlete.id, name: athlete.name, countryCode: athlete.countryCode,
      countryName: athlete.countryName, sport: athlete.sport, sportRawName: athlete.sportRawName,
      scoreType: athlete.scoreType, goldMedals: athlete.medals.gold, silverMedals: athlete.medals.silver,
      bronzeMedals: athlete.medals.bronze, bestTime: rawBestTime,
    };
  });

  /**
   * Filtered and sorted list of athletes based on current filter and search criteria.
   */
  protected filteredAthletes: Signal<Athlete[]> = computed((): Athlete[] => {
    const filtered: Athlete[] = this.dataService.athletes().filter((athlete: Athlete): boolean => {
      const matchesSearchText: boolean =
        athlete.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        athlete.countryName.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesCountryFilter: boolean =
        this.filterCountry() === 'all' || athlete.countryName === this.filterCountry();
      const matchesSportsFilter: boolean =
        this.filterSport() === 'all' || athlete.sportRawName === this.filterSport();
      return matchesSearchText && matchesCountryFilter && matchesSportsFilter;
    });

    return filtered.sort((a, b): number => sortByMedals(a, b, a.name, b.name, this.filterMedal()));
  });

  /**
   * Opens the edit modal for the given athlete.
   *
   * @param {Athlete} athlete - The athlete to edit.
   */
  protected onEditAthlete(athlete: Athlete): void {
    this.editingAthlete.set(athlete);
    this.isAthleteModalOpen.set(true);
  }

  /**
   * Deletes an athlete by their ID.
   *
   * @param {number} athleteId - The ID of the athlete to delete.
   */
  protected onDeleteAthlete(athleteId: number): void {
    const athlete: Athlete | undefined = this.dataService.athletes().find(a => a.id === athleteId);
    if (!athlete) return;

    this.athleteService.deleteAthlete(athleteId).subscribe({
      next: (): void => {
        this.dataService.athletes.update(current => current.filter(a => a.id !== athleteId));
        this.alertService.success(
          this.translateService.instant('ALERT.ATHLETE.DELETE').replace('[name]', athlete.name));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error deleting athlete:', error);
        this.alertService.error(
          this.translateService.instant('ALERT.ATHLETE.DELETE.ERROR').replace('[name]', athlete.name));
      }
    });
  }

  /**
   * Handles adding a new athlete via the modal form.
   *
   * @param {AthleteForm} form - The form data for the new athlete.
   */
  protected onAddAthlete(form: AthleteForm): void {
    const { firstName, lastName, countryId } = this.splitNameAndCountry(form);

    this.athleteService.createAthlete({firstName, lastName, countryId, goldMedals: form.goldMedals,
                                       silverMedals: form.silverMedals, bronzeMedals: form.bronzeMedals,
                                       bestTime: form.bestTime || null, sport: form.sportRawName,
                                       scoreType: form.scoreType
    }).subscribe({
      next: (): void => {
        this.dataService.load();
        this.isAthleteModalOpen.set(false);
        this.suspendedAthleteForm.set(null);
        this.alertService.success(
          this.translateService.instant('ALERT.ATHLETE.ADD').replace('[name]', form.name));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error creating athlete:', error);
        this.alertService.error(
          this.translateService.instant('ALERT.ATHLETE.ADD.ERROR').replace('[name]', form.name));
      }
    });
  }

  /**
   * Handles updating an existing athlete via the modal form.
   *
   * @param {AthleteForm} form - The updated form data.
   */
  protected onUpdateAthlete(form: AthleteForm): void {
    if (!form.id) return;
    const { firstName, lastName, countryId } = this.splitNameAndCountry(form);

    this.athleteService.updateAthlete(form.id, {firstName, lastName, countryId, goldMedals: form.goldMedals,
                                                silverMedals: form.silverMedals, bronzeMedals: form.bronzeMedals,
                                                bestTime: form.bestTime || null, sport: form.sportRawName, scoreType: form.scoreType,
    }).subscribe({
      next: (): void => {
        this.dataService.load();
        this.editingAthlete.set(null);
        this.isAthleteModalOpen.set(false);
        this.alertService.success(
          this.translateService.instant('ALERT.ATHLETE.EDIT').replace('[name]', form.name));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error updating athlete:', error);
        this.alertService.error(
          this.translateService.instant('ALERT.ATHLETE.EDIT.ERROR').replace('[name]', form.name));
      }
    });
  }

  /**
   * Handles the country creation flow triggered from within the athlete modal.
   * Suspends the current athlete form and delegates the event up to the parent.
   *
   * @param {AthleteForm} currentForm - The athlete form state to suspend.
   */
  protected onOpenCountryModalFromAthlete(currentForm: AthleteForm): void {
    this.suspendedAthleteForm.set({ ...currentForm });
    this.isAthleteModalOpen.set(false);
    this.isCountryModalOpen.set(true);
  }

  /**
   * Handles adding a new country from within the athlete view's inline country modal.
   *
   * @param {CountryForm} form - The country form data.
   */
  protected onAddCountry(form: CountryForm): void {
    this.countryService.createCountry({ code: form.countryCode.toUpperCase(), name: form.countryName }).subscribe({
      next: (): void => {
        this.dataService.load();
        this.isCountryModalOpen.set(false);
        this.alertService.success(
          this.translateService.instant('ALERT.COUNTRY.ADD').replace('[name]', form.countryName));

        const suspended: AthleteForm | null = this.suspendedAthleteForm();
        if (suspended === null) { this.suspendedAthleteForm.set(null); return; }

        const resumeForm: AthleteForm = {...suspended, countryName: form.countryName,
                                         countryCode: form.countryCode.toUpperCase()};
        this.editingAthlete.set(null);

        // Use a minimal timeout so that the data reload has been queued first
        setTimeout((): void => {
          this.suspendedAthleteForm.set(resumeForm);
          this.isAthleteModalOpen.set(true);
        }, 150);
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
   * Closes the inline country modal and re-opens the athlete modal if suspended.
   */
  protected onCloseCountryModal(): void {
    this.isCountryModalOpen.set(false);
    if (this.suspendedAthleteForm() !== null) {
      this.isAthleteModalOpen.set(true);
    }
  }

  /**
   * Derives all sport results for a given athlete by scanning {@link DISCIPLINE_RESULTS}.
   * Resolves the translated sport display name from the loaded sports data.
   * Results are sorted gold → silver → bronze to match the medal-pills order.
   * TODO: Replace with real API data once available.
   *
   * @param {string} name - The athlete's full name.
   * @returns {AthleteResult[]} Sorted list of sport results with translated names.
   */
  protected resultsForAthlete(name: string): AthleteResult[] {
    const medalOrder: Record<string, number> = { gold: 0, silver: 1, bronze: 2 };
    const sportNameMap: Map<string, string> = new Map(
      this.dataService.sports().map(s => [s.rawName, s.name])
    );

    const results: AthleteResult[] = [];
    for (const [rawName, entry] of Object.entries(DISCIPLINE_RESULTS) as [string, DisciplineResult][]) {
      const sport: string = sportNameMap.get(rawName) ?? rawName;
      if (entry.gold.name   === name) results.push({ sport, medal: 'gold',   result: entry.gold.result });
      if (entry.silver.name === name) results.push({ sport, medal: 'silver', result: entry.silver.result });
      if (entry.bronze.name === name) results.push({ sport, medal: 'bronze', result: entry.bronze.result });
    }

    return results.sort((a, b) => medalOrder[a.medal] - medalOrder[b.medal]);
  }

  /**
   * Toggles the expanded state of an athlete row.
   * Has no effect when the athlete has no results.
   *
   * @param {Athlete} athlete - The athlete whose row should be toggled.
   */
  protected toggleAthlete(athlete: Athlete): void {
    if (this.resultsForAthlete(athlete.name).length === 0) return;

    this.expandedAthletes.update(set => {
      const next = new Set(set);
      next.has(athlete.id) ? next.delete(athlete.id) : next.add(athlete.id);
      return next;
    });
  }

  /**
   * Returns whether an athlete row is currently expanded.
   *
   * @param {number} athleteId - The ID of the athlete to check.
   * @returns {boolean} True if the row is expanded.
   */
  protected isAthleteExpanded(athleteId: number): boolean {
    return this.expandedAthletes().has(athleteId);
  }

  /**
   * Splits a full name and resolves the countryId from the countries data.
   */
  private splitNameAndCountry(form: AthleteForm): { firstName: string; lastName: string; countryId: number } {
    const nameParts: string[] = form.name.trim().split(/\s+/);
    const firstName: string = nameParts[0] || '';
    const lastName: string = nameParts.slice(1).join(' ') || '';

    const country: CountryStats | undefined = this.dataService.countriesData().find(c => c.countryName === form.countryName);
    const countryId: number = country ? country.countryId : 0;
    return { firstName, lastName, countryId };
  }
}


