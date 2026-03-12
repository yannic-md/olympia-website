import {Component, computed, input, InputSignal, output, OutputEmitterRef, Signal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {HttpErrorResponse} from '@angular/common/http';
import {AthleteForm, AthleteResult, V2Athlete} from '../../../../types/Athlete';
import {CountryStats} from '../../../../types/Country';
import {TableCountryBadgeComponent} from '../../../../layout/elements/table-country-badge/table-country-badge.component';
import {TableMedalPillsComponent} from '../../../../layout/elements/table-medal-pills/table-medal-pills.component';
import {TableActionsComponent} from '../../../../layout/elements/table-actions/table-actions.component';
import {ModalAthleteComponent} from '../../../../layout/sections/modal/modal-athlete/modal-athlete.component';
import {ModalCountryComponent} from '../../../../layout/sections/modal/modal-country/modal-country.component';
import {AlertService} from '../../../../services/api/alert/alert.service';
import {AuthService} from '../../../../services/api/auth/auth.service';
import {AthleteService} from '../../../../services/api/athlete/athlete.service';
import {DataHolderService} from '../../../../services/data-holder/data-holder.service';
import {MiscService} from '../../../../services/misc/misc.service';
import {signal, WritableSignal} from '@angular/core';
import {sortByMedals} from '../../utils/medal-sort.util';
import {LeaderboardResponse} from "../../../../types/API";
import {V2SportResult} from "../../../../types/Disciplines";

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
  styleUrl: './athlete-view.component.css'
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
  protected editingAthlete: WritableSignal<V2Athlete | null> = signal(null);
  protected expandedAthletes: WritableSignal<Set<number>> = signal(new Set<number>());

  constructor(protected dataService: DataHolderService, protected authService: AuthService,
              private alertService: AlertService, private athleteService: AthleteService,
              private translateService: TranslateService, protected miscService: MiscService) {}

  /**
   * Computed signal that transforms the currently selected athlete into an `AthleteForm` model.
   */
  protected athleteEditData: Signal<AthleteForm | null> = computed((): AthleteForm | null => {
    const athlete: V2Athlete | null = this.editingAthlete();
    if (!athlete) return null;

    const firstResult = athlete.results?.[0];
    const rawBestTime: string = (firstResult?.result || '').replace(/\s*pts$/i, '').replace(/\s*wins$/i, '')
                                                           .replace(/\s*(Siege|Punkte|Victoires|Points)$/i, '').trim();

    return { id: athlete.id, name: `${athlete.firstName} ${athlete.lastName}`,
             countryCode: athlete.country?.code ?? '', countryName: athlete.country?.name ?? '',
             sport: firstResult?.sportName ?? '', sportRawName: firstResult?.sportRawName ?? '',
             scoreType: firstResult?.scoreType ?? null, goldMedals: athlete.medals.gold,
             silverMedals: athlete.medals.silver, bronzeMedals: athlete.medals.bronze, bestTime: rawBestTime,
    };
  });

  /**
   * Fully sorted list of athletes (all filters except text search applied) used to determine
   * the true rank of each athlete independently of the current search query.
   */
  protected sortedAthletes: Signal<V2Athlete[]> = computed((): V2Athlete[] => {
    const filtered: V2Athlete[] = this.dataService.athletes().filter((athlete: V2Athlete): boolean => {
      const matchesCountryFilter: boolean =
        this.filterCountry() === 'all' || athlete.country?.name === this.filterCountry();
      const matchesSportsFilter: boolean =
        this.filterSport() === 'all' || athlete.results?.some(r => r.sportRawName === this.filterSport());
      return matchesCountryFilter && matchesSportsFilter;
    });

    return filtered.sort((a, b): number =>
      sortByMedals(a, b, `${a.firstName} ${a.lastName}`, `${b.firstName} ${b.lastName}`, this.filterMedal())
    );
  });

  /**
   * Filtered and sorted list of athletes based on current filter and search criteria.
   */
  protected filteredAthletes: Signal<V2Athlete[]> = computed((): V2Athlete[] => {
    const query: string = this.searchQuery().toLowerCase();
    return this.sortedAthletes().filter((athlete: V2Athlete): boolean =>
      `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(query) ||
      (athlete.country?.name ?? '').toLowerCase().includes(query)
    );
  });

  /**
   * Deletes an athlete by their ID and patches all local data stores.
   *
   * @param {number} athleteId - The ID of the athlete to delete.
   */
  protected onDeleteAthlete(athleteId: number): void {
    const athlete: V2Athlete | undefined = this.dataService.athletes().find(a => a.id === athleteId);
    if (!athlete) return;
    const athleteName: string = `${athlete.firstName} ${athlete.lastName}`;

    this.athleteService.deleteAthlete(athleteId).subscribe({
      next: (): void => {
        this.athleteService.patchAthleteDelete(athleteId, athlete.country?.id ?? 0);
        this.alertService.success(
          this.translateService.instant('ALERT.ATHLETE.DELETE').replace('[name]', athleteName));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error deleting athlete:', error);
        this.alertService.error(
          this.translateService.instant('ALERT.ATHLETE.DELETE.ERROR').replace('[name]', athleteName));
      }
    });
  }

  /**
   * Handles the `athleteCreated` event emitted by the athlete modal after a successful API call.
   * The modal has already patched all data stores and emitted the alert — here we only clean up local state.
   *
   * @param {V2Athlete} _athlete - The newly created athlete (unused here, consumed by the modal internally).
   */
  protected onAthleteCreated(_athlete: V2Athlete): void {
    this.isAthleteModalOpen.set(false);
    this.editingAthlete.set(null);
    this.suspendedAthleteForm.set(null);
  }

  /**
   * Handles updating an existing athlete via the modal form & patches all local data stores.
   *
   * @param {AthleteForm} form - The updated form data.
   */
  protected onUpdateAthlete(form: AthleteForm): void {
    if (!form.id) return;
    const previousAthlete: V2Athlete | undefined = this.dataService.athletes().find(a => a.id === form.id);
    const previousCountryId: number = previousAthlete?.country?.id ?? 0;

    const { firstName, lastName, countryId } = this.splitNameAndCountry(form);

    this.athleteService.updateAthlete(form.id, {firstName, lastName, countryId}).subscribe({
      next: (api: V2Athlete): void => {
        this.athleteService.patchAthleteUpdate(api, previousCountryId);

        this.editingAthlete.set(null);
        this.suspendedAthleteForm.set(null);
        this.isAthleteModalOpen.set(false);
        this.alertService.success(
          this.translateService.instant('ALERT.ATHLETE.EDIT').replace('[name]', `${api.firstName} ${api.lastName}`));
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
   * Handles the resume flow after a new country was created from within the athlete modal.
   * Re-opens the athlete modal with the suspended form pre-filled with the new country.
   *
   * @param {CountryStats} country - The newly created country emitted by the country modal.
   */
  protected onCountryCreated(country: CountryStats): void {
    const suspended: AthleteForm | null = this.suspendedAthleteForm();
    this.isCountryModalOpen.set(false);

    if (!suspended) { this.suspendedAthleteForm.set(null); return; }
    const resumeForm: AthleteForm = { ...suspended, countryName: country.countryName,
                                      countryCode: country.countryCode };

    // Use a minimal timeout so that the data reload has been queued first
    setTimeout((): void => {
      this.suspendedAthleteForm.set(resumeForm);
      this.isAthleteModalOpen.set(true);
    }, 150);
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
   * Derives all sport results for a given athlete from the API data.
   * Sorted gold → silver → bronze to match medal-pills order.
   *
   * @param {number} athleteId - The athlete's ID.
   * @returns {AthleteResult[]} Sorted list of sport results with translated names.
   */
  protected resultsForAthlete(athleteId: number): AthleteResult[] {
    const leaderboardData: LeaderboardResponse | null = this.dataService.leaderboardData();
    if (!leaderboardData) { return []; }

    const athlete: V2Athlete | undefined = leaderboardData.athletes.find(a => a.id === athleteId);
    if (!athlete) { return []; }

    const medalOrder: Record<string, number> = { gold: 0, silver: 1, bronze: 2 };

    // return the list of sport results ONLY if there's a medal & convert it to AthleteResult
    return athlete.results.filter(r => r.medal !== null)
      .map((r: V2SportResult): AthleteResult => ({
        sport: r.sportName,
        result: (r.result ?? '').replace(/\s*(pts|wins)$/i, '').trim(),
        scoreType: r.scoreType ?? null,
        medal: r.medal!.toLowerCase() as 'gold' | 'silver' | 'bronze'
      }))
      .sort((a, b) => (medalOrder[a.medal] - medalOrder[b.medal]) || a.sport.localeCompare(b.sport));
  }

  /**
   * Toggles the expanded state of an athlete row.
   * Has no effect when the athlete has no results.
   *
   * @param {V2Athlete} athlete - The athlete whose row should be toggled.
   */
  protected toggleAthlete(athlete: V2Athlete): void {
    if (this.resultsForAthlete(athlete.id).length === 0) return;

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
   * Splits a full name and resolves the countryId (+ full CountryStats) from the countries data.
   */
  private splitNameAndCountry(form: AthleteForm): { firstName: string; lastName: string; countryId: number } {
    const nameParts: string[] = form.name.trim().split(/\s+/);
    const firstName: string = nameParts[0] || '';
    const lastName: string = nameParts.slice(1).join(' ') || '';

    const country: CountryStats | undefined = this.dataService.countriesData().find(c => c.countryName === form.countryName);
    return { firstName, lastName, countryId: country?.countryId ?? 0 };
  }
}

