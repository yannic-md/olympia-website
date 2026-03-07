import {animate, style, transition, trigger} from '@angular/animations';
import {Component, computed, input, InputSignal, Signal, signal, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {HttpErrorResponse} from '@angular/common/http';
import {DisciplineWinnerRowComponent} from '../../../../layout/elements/discipline-winner-row/discipline-winner-row.component';
import {DataHolderService} from '../../../../services/data-holder/data-holder.service';
import {AuthService} from '../../../../services/api/auth/auth.service';
import {AthleteService} from '../../../../services/api/athlete/athlete.service';
import {AlertService} from '../../../../services/api/alert/alert.service';
import {ResultService} from '../../../../services/api/result/result.service';
import {AthleteForm, V2Athlete} from '../../../../types/Athlete';
import {CountryStats} from '../../../../types/Country';
import {DisciplineCard, DisciplineParticipant,
  DisciplineResultForm,
  DisciplineWinner, ResultPayload, ResultResponse, V2Sport,
} from '../../../../types/Disciplines';
import {ModalDisciplineComponent} from '../../../../layout/sections/modal/modal-discipline/modal-discipline.component';
import {ModalAthleteComponent} from '../../../../layout/sections/modal/modal-athlete/modal-athlete.component';
import {ModalCountryComponent} from '../../../../layout/sections/modal/modal-country/modal-country.component';

@Component({
  selector: 'app-disciplines-view',
  imports: [TranslatePipe, NgOptimizedImage, DisciplineWinnerRowComponent,
            ModalDisciplineComponent, ModalAthleteComponent, ModalCountryComponent],
  templateUrl: './disciplines-view.component.html',
  styleUrls: ['./disciplines-view.component.css'],
  animations: [
    trigger('viewEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.99)' }),
        animate('340ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
    ]),
  ],
  host: { '[@viewEnter]': '' },
})
export class DisciplinesViewComponent {
  filterCountry: InputSignal<string> = input.required<string>();
  filterSport: InputSignal<string> = input.required<string>();
  filterMedal: InputSignal<'all' | 'gold' | 'silver' | 'bronze'> = input.required<'all' | 'gold' | 'silver' | 'bronze'>();
  searchQuery: InputSignal<string> = input.required<string>();

  protected imageErrors: WritableSignal<Set<string>> = signal(new Set<string>());
  protected isDisciplineModalOpen: WritableSignal<boolean> = signal(false);
  protected isAthleteModalOpen: WritableSignal<boolean> = signal(false);
  protected isCountryModalOpen: WritableSignal<boolean> = signal(false);
  protected suspendedDisciplineForm: WritableSignal<DisciplineResultForm | null> = signal(null);
  protected suspendedAthleteForm: WritableSignal<AthleteForm | null> = signal(null);

  constructor(protected dataService: DataHolderService, protected authService: AuthService,
              private athleteService: AthleteService, private alertService: AlertService,
              private translateService: TranslateService, private resultService: ResultService) {}

  /**
   * Marks a sport card image as failed so the fallback placeholder is rendered instead.
   *
   * @param {string} rawName - The rawName of the sport whose image failed.
   */
  protected onImageError(rawName: string): void {
    this.imageErrors.update(errors => {
      const next = new Set(errors);
      next.add(rawName);
      return next;
    });
  }

  /**
   * Reactive computed signal that produces the fully filtered and sorted list of
   * {@link DisciplineCard} objects displayed in the discipline grid.
   *
   * Re-evaluates automatically whenever any of the four filter signals change.
   * Returns an empty array while the V2 leaderboard data has not yet been loaded.
   */
  protected disciplineCards: Signal<DisciplineCard[]> = computed((): DisciplineCard[] => {
    const sports: V2Sport[] = this.dataService.sports();
    if (!sports.length) { return []; }

    const query: string         = this.searchQuery().toLowerCase().trim();
    const sportFilter: string   = this.filterSport();
    const countryFilter: string = this.filterCountry();
    void this.filterMedal(); // register as reactive dependency; row-level filtering is handled in the template

    return sports
      .filter((sport: V2Sport): boolean => this.sportPassesFilters(sport, sportFilter, query))
      .map((sport: V2Sport): DisciplineCard => this.buildDisciplineCard(sport, query, countryFilter))
      .sort((a: DisciplineCard, b: DisciplineCard): number => a.displayName.localeCompare(b.displayName));
  });

  /**
   * Returns `true` when a sport should be included in the visible card list.
   *
   * A sport is excluded when:
   * - A specific sport filter is active and the sport's rawName does not match it.
   * - A free-text query is active and neither the sport name, any participant's full
   *   name, nor any participant's country name contains the query string.
   *
   * @param {V2Sport} sport       - The V2 sport entry to evaluate.
   * @param {string}  sportFilter - The currently selected sport rawName, or `'all'`.
   * @param {string}  query       - Lower-cased, trimmed free-text search string (may be empty).
   */
  private sportPassesFilters(sport: V2Sport, sportFilter: string, query: string): boolean {
    if (sportFilter !== 'all' && sport.rawName !== sportFilter) { return false; }
    if (!query) { return true; }
    if (this.sportNameMatchesQuery(sport, query)) { return true; }

    return sport.participants.some((p: DisciplineParticipant): boolean =>
      this.participantMatchesQuery(p, query)
    );
  }

  /**
   * Returns `true` when the sport's display name or raw name contains the query string.
   *
   * @param {V2Sport} sport - The V2 sport entry to check.
   * @param {string}  query - Lower-cased search string.
   */
  private sportNameMatchesQuery(sport: V2Sport, query: string): boolean {
    return sport.name.toLowerCase().includes(query) || sport.rawName.toLowerCase().includes(query);
  }

  /**
   * Returns `true` when a participant's full name or country name contains the query string.
   *
   * @param {DisciplineParticipant} participant - A single sport participant.
   * @param {string}                query       - Lower-cased search string.
   */
  private participantMatchesQuery(participant: DisciplineParticipant, query: string): boolean {
    const fullName: string    = `${participant.firstName} ${participant.lastName}`.toLowerCase();
    const countryName: string = (participant.countryName ?? '').toLowerCase();
    return fullName.includes(query) || countryName.includes(query);
  }

  /**
   * Maps a single V2 sport entry into a {@link DisciplineCard}, resolving each of
   * the three medal slots (GOLD / SILVER / BRONZE) individually.
   *
   * @param {V2Sport} sport         - The V2 sport to transform.
   * @param {string}  query         - Lower-cased, trimmed free-text query (may be empty).
   * @param {string}  countryFilter - The currently selected country name, or `'all'`.
   */
  private buildDisciplineCard(sport: V2Sport, query: string, countryFilter: string): DisciplineCard {
    const sportNameMatches: boolean = !query || this.sportNameMatchesQuery(sport, query);

    return { rawName: sport.rawName, displayName: sport.name,
             gold:   this.resolveWinner(sport, 'GOLD',   query, countryFilter, sportNameMatches),
             silver: this.resolveWinner(sport, 'SILVER', query, countryFilter, sportNameMatches),
             bronze: this.resolveWinner(sport, 'BRONZE', query, countryFilter, sportNameMatches) };
  }

  /**
   * Resolves a single medal slot to a {@link DisciplineWinner} or `null`.
   *
   * Returns `null` when:
   * - No participant with the requested medal exists in this sport.
   * - A country filter is active and the winner's country does not match.
   * - A free-text query is active, the sport name itself does not match, and
   *   neither the winner's name nor country name satisfies the query.
   *
   * @param {V2Sport}                      sport            - The V2 sport to search in.
   * @param {'GOLD' | 'SILVER' | 'BRONZE'} medal            - The medal rank to resolve (`GOLD`, `SILVER`, or `BRONZE`).
   * @param {string}                       query            - Lower-cased, trimmed free-text query (may be empty).
   * @param {string}                       countryFilter    - The currently selected country name, or `'all'`.
   * @param {boolean}                      sportNameMatches - Whether the sport name already satisfies the query.
   */
  private resolveWinner(sport: V2Sport, medal: 'GOLD' | 'SILVER' | 'BRONZE', query: string, countryFilter: string,
                        sportNameMatches: boolean): DisciplineWinner | null {
    const participant: DisciplineParticipant | undefined =
      sport.participants.find((p: DisciplineParticipant): boolean => p.medal === medal);

    if (!participant) { return null; }
    const fullName: string    = `${participant.firstName} ${participant.lastName}`;
    const countryName: string = participant.countryName ?? participant.countryCode ?? '';

    if (countryFilter !== 'all' && countryName !== countryFilter) { return null; }
    if (!sportNameMatches && !this.participantMatchesQuery(participant, query)) { return null; }

    return { name: fullName, countryCode: (participant.countryCode ?? '').toLowerCase(),
             countryName: countryName, result: (participant.result ?? '').replace(/\s*(pts|wins)$/i, '').trim(),
             scoreType: sport.scoreType ?? null };
  }

  /**
   * Handles a submitted discipline result from the modal.
   * Resolves the sport ID from the raw name, calls the upsert endpoint and
   * patches all local stores on success.
   *
   * @param {DisciplineResultForm} form - The submitted discipline result form data.
   */
  protected onSubmitDisciplineResult(form: DisciplineResultForm): void {
    const sport: V2Sport | undefined = this.dataService.sports().find(s => s.rawName === form.sportRawName);
    if (!sport) {
      this.alertService.error(this.translateService.instant('ALERT.RESULT.ADD.ERROR'));
      return;
    }

    const medalUpper = form.medal.toUpperCase() as 'GOLD' | 'SILVER' | 'BRONZE';
    const payload: ResultPayload = { athleteId: form.athleteId, sportId: sport.id, medal: medalUpper,
                                     timeOrPoints: form.resultValue, scoreType: sport.scoreType ?? null };

    this.resultService.upsertResult(payload).subscribe({
      next: (res: ResultResponse): void => {
        const athleteName: string = form.athleteName ||
          (this.dataService.athletes().find(a => a.id === form.athleteId)?.name ?? `#${form.athleteId}`);

        this.resultService.patchResultUpsert(form.sportRawName, medalUpper, form.athleteId, res.athleteFirstName,
                                             res.athleteLastName, res.id, res.timeOrPoints, sport.id, sport.name,
                                             res.scoreType ?? sport.scoreType ?? null);

        this.alertService.success(this.translateService.instant('ALERT.RESULT.ADD').replace('[name]', athleteName)
                                                                                        .replace('[sport]', sport.name));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error upserting result:', error);
        this.alertService.error(this.translateService.instant('ALERT.RESULT.ADD.ERROR'));
      }
    });
  }

  /**
   * Looks up the result ID for the given sport + medal slot, calls the delete
   * endpoint, and patches the local stores on success.
   *
   * @param {string} rawName - The raw sport identifier of the discipline card.
   * @param {'gold' | 'silver' | 'bronze'} medal - The medal rank to remove.
   */
  protected onDeleteWinner(rawName: string, medal: 'gold' | 'silver' | 'bronze'): void {
    const upperMedal = medal.toUpperCase() as 'GOLD' | 'SILVER' | 'BRONZE';
    const sport: V2Sport | undefined = this.dataService.sports().find(s => s.rawName === rawName);
    const participant: DisciplineParticipant | undefined =
      sport?.participants.find(p => p.medal === upperMedal);

    if (!participant?.resultId) {
      this.alertService.error(this.translateService.instant('ALERT.RESULT.DELETE.ERROR'));
      return;
    }

    this.resultService.deleteResult(participant.resultId).subscribe({
      next: (): void => {
        this.resultService.patchResultDelete(rawName, upperMedal, participant.athleteId);
        const athleteName: string = `${participant.firstName} ${participant.lastName}`.trim();
        const sportName: string = sport?.name ?? rawName;

        this.alertService.success(this.translateService.instant('ALERT.RESULT.DELETE').replace('[name]', athleteName)
                                                                                           .replace('[sport]', sportName));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error deleting result:', error);
        this.alertService.error(this.translateService.instant('ALERT.RESULT.DELETE.ERROR'));
      }
    });
  }

  /**
   * Closes the discipline modal and resets suspended state.
   */
  protected onCloseDisciplineModal(): void {
    this.isDisciplineModalOpen.set(false);
    this.suspendedDisciplineForm.set(null);
  }

  /**
   * Suspends the discipline form snapshot and opens the athlete modal.
   * The snapshot is passed back via [resumeData] on the discipline modal when returning.
   *
   * @param {DisciplineResultForm} snapshot - The current discipline form state.
   */
  protected onOpenAthleteModalFromDiscipline(snapshot: DisciplineResultForm): void {
    this.suspendedDisciplineForm.set({ ...snapshot });
    this.isDisciplineModalOpen.set(false);
    this.isAthleteModalOpen.set(true);
  }

  /**
   * Handles adding a new athlete from within the discipline flow.
  /**
   * Handles adding a new athlete from within the discipline flow.
   * Patches all local data stores without triggering a full reload.
   *
   * @param {AthleteForm} form - The new athlete form data.
   */
  protected onAddAthleteFromDiscipline(form: AthleteForm): void {
    const { firstName, lastName, countryId } = this.splitNameAndCountry(form);
    const country: CountryStats | undefined = this.dataService.countriesData().find(c => c.countryName === form.countryName);

    this.athleteService.createAthlete({ firstName, lastName, countryId }).subscribe({
      next: (api: V2Athlete): void => {
        // Pre-select the new athlete in the suspended discipline form
        this.suspendedDisciplineForm.update(f => f && api.id
          ? { ...f, athleteId: api.id, athleteName: form.name }
          : f
        );

        // Patch local stores — no full reload needed
        const mapped = {
          id: api.id, name: `${api.firstName} ${api.lastName}`,
          countryId: api.country?.id ?? countryId,
          countryCode: api.country?.code ?? country?.countryCode ?? '',
          // form.countryName is the translated display name chosen by the user — always prefer it over the raw API name
          countryName: form.countryName,
          sport: '', sportRawName: '', scoreType: null, bestTime: null,
          medals: { gold: 0, silver: 0, bronze: 0 },
        };
        this.athleteService.patchAthleteAdd(api, mapped);

        this.isAthleteModalOpen.set(false);
        this.suspendedAthleteForm.set(null);
        this.alertService.success(
          this.translateService.instant('ALERT.ATHLETE.ADD').replace('[name]', form.name));

        // Re-open discipline modal after a short delay so signals propagate
        setTimeout((): void => {
          this.isDisciplineModalOpen.set(true);
        }, 50);
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error creating athlete:', error);
        this.alertService.error(this.translateService.instant('ALERT.ATHLETE.ADD.ERROR'));
      }
    });
  }

  /**
   * Closes the athlete modal and re-opens the discipline modal if a snapshot is present.
   */
  protected onCloseAthleteModal(): void {
    this.isAthleteModalOpen.set(false);
    this.suspendedAthleteForm.set(null);
    if (this.suspendedDisciplineForm() !== null) {
      this.isDisciplineModalOpen.set(true);
    }
  }

  /**
   * Suspends the athlete form snapshot and opens the country modal.
   *
   * @param {AthleteForm} currentForm - The athlete form state to suspend.
   */
  protected onOpenCountryModalFromAthlete(currentForm: AthleteForm): void {
    this.suspendedAthleteForm.set({ ...currentForm });
    this.isAthleteModalOpen.set(false);
    this.isCountryModalOpen.set(true);
  }

  /**
   * Handles the countryCreated event from the country sub-modal.
   * The modal-country component already called the API and patched countriesData,
   * so we only need to close the country modal and resume the athlete sub-modal
   * with the newly created country pre-selected.
   *
   * @param {CountryStats} created - The country that was just created.
   */
  protected onAddCountryFromDiscipline(created: CountryStats): void {
    this.isCountryModalOpen.set(false);

    const suspended: AthleteForm | null = this.suspendedAthleteForm();
    if (!suspended) { return; }

    const resumeForm: AthleteForm = { ...suspended,  countryName: created.countryName,  countryCode: created.countryCode };

    setTimeout((): void => {  // wait until data is ready
      this.suspendedAthleteForm.set(resumeForm);
      this.isAthleteModalOpen.set(true);
    }, 150);
  }

  /**
   * Closes the country modal and re-opens the athlete modal if suspended.
   */
  protected onCloseCountryModal(): void {
    this.isCountryModalOpen.set(false);
    if (this.suspendedAthleteForm() !== null) {
      this.isAthleteModalOpen.set(true);
    }
  }

  /**
   * Splits a full name and resolves the countryId from the countries data.
   */
  private splitNameAndCountry(form: AthleteForm): { firstName: string; lastName: string; countryId: number } {
    const parts: string[] = form.name.trim().split(/\s+/);
    const country: CountryStats | undefined =
      this.dataService.countriesData().find(c => c.countryName === form.countryName);

    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '',
             countryId: country ? country.countryId : 0 };
  }
}
