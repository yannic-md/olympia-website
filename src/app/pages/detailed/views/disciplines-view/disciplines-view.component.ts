import {Component, computed, input, InputSignal, Signal, signal, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {HttpErrorResponse} from '@angular/common/http';
import {DisciplineWinnerRowComponent} from '../../../../layout/elements/discipline-winner-row/discipline-winner-row.component';
import {DataHolderService} from '../../../../services/data-holder/data-holder.service';
import {AuthService} from '../../../../services/api/auth/auth.service';
import {AthleteService} from '../../../../services/api/athlete/athlete.service';
import {CountryService} from '../../../../services/api/country/country.service';
import {AlertService} from '../../../../services/api/alert/alert.service';
import {SportEntry} from '../../../../services/api/sports/sports.service';
import {AthleteForm} from '../../../../types/Athlete';
import {CountryForm, CountryStats} from '../../../../types/Country';
import {
  DISCIPLINE_RESULTS,
  DisciplineCard,
  DisciplineResult, DisciplineResultForm,
  DisciplineWinner,
} from '../../../../types/Disciplines';
import {ModalDisciplineComponent} from '../../../../layout/sections/modal/modal-discipline/modal-discipline.component';
import {ModalAthleteComponent} from '../../../../layout/sections/modal/modal-athlete/modal-athlete.component';
import {ModalCountryComponent} from '../../../../layout/sections/modal/modal-country/modal-country.component';

@Component({
  selector: 'app-disciplines-view',
  imports: [TranslatePipe, NgOptimizedImage, DisciplineWinnerRowComponent,
            ModalDisciplineComponent, ModalAthleteComponent, ModalCountryComponent],
  templateUrl: './disciplines-view.component.html',
  styleUrls: ['./disciplines-view.component.css']
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
              private athleteService: AthleteService, private countryService: CountryService,
              private alertService: AlertService, private translateService: TranslateService) {}

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
   * Builds the filtered and mapped list of discipline cards to display in the grid.
   *
   * Reads the static {@link DISCIPLINE_RESULTS} map as the source of truth for medal winners
   * and applies three independent filters: the sport-dropdown selection, the free-text search
   * query (matched against sport name, winner names and country names), and the country filter.
   */
  protected disciplineCards: Signal<DisciplineCard[]> = computed((): DisciplineCard[] => {
    const query: string         = this.searchQuery().toLowerCase().trim();
    const countryFilter: string = this.filterCountry();
    const sportFilter: string   = this.filterSport();

    void this.filterMedal(); // reactive dependency – row visibility is handled in the template
    const sportNameMap: Map<string, string> = this.buildSportNameMap();

    return Object.entries(DISCIPLINE_RESULTS)
      .filter(([rawName, results]: [string, DisciplineResult]): boolean =>
        // check if the discipline should be displayed based on the filter
        this.matchesSportFilter(rawName, results, sportFilter, query, sportNameMap))
      .map(([rawName, results]: [string, DisciplineResult]): DisciplineCard => {
        // Transform each passing entry into a DisciplineCard
        const displayName: string = sportNameMap.get(rawName) ?? rawName;
        const sportNameMatches: boolean = !query || displayName.toLowerCase().includes(query) ||
                                          rawName.toLowerCase().includes(query);

        return { rawName, displayName,
                 gold:   this.resolveSlot(results.gold,   countryFilter, query, sportNameMatches),
                 silver: this.resolveSlot(results.silver, countryFilter, query, sportNameMatches),
                 bronze: this.resolveSlot(results.bronze, countryFilter, query, sportNameMatches) };
      }).sort((a: DisciplineCard, b: DisciplineCard): number => a.displayName.localeCompare(b.displayName));
  });

  /**
   * Builds a rawName → translated display name map from the loaded sports API data.
   * Falls back to the rawName itself when no translation is available.
   */
  private buildSportNameMap(): Map<string, string> {
    return new Map<string, string>(
      this.dataService.sports().map((s: SportEntry): [string, string] => [s.rawName, s.name])
    );
  }

  /**
   * Returns true when the given sport entry should be included based on the
   * sport-dropdown filter and the free-text search query.
   *
   * @param rawName - The raw sport identifier.
   * @param results - The discipline's winner data.
   * @param sportFilter - The currently selected sport rawName, or 'all'.
   * @param query - The normalised (lowercase, trimmed) search string.
   * @param sportNameMap - Translated name lookup built by {@link buildSportNameMap}.
   */
  private matchesSportFilter(rawName: string, results: DisciplineResult, sportFilter: string, query: string,
                             sportNameMap: Map<string, string>): boolean {
    if (sportFilter !== 'all' && rawName !== sportFilter) return false;
    if (!query) return true;

    const displayName: string = sportNameMap.get(rawName) ?? rawName;
    if (displayName.toLowerCase().includes(query) || rawName.toLowerCase().includes(query)) return true;

    return [results.gold, results.silver, results.bronze].some(
      (w: DisciplineWinner): boolean =>
        w.name.toLowerCase().includes(query) ||
        w.countryName.toLowerCase().includes(query)
    );
  }

  /**
   * Resolves a single medal slot to its winner or null.
   *
   * Returns null when the winner does not match the active country filter,
   * or when a free-text query is active but neither the winner's name nor
   * country name contains it (unless the sport name itself already matched).
   *
   * @param winner - The candidate winner for this slot.
   * @param countryFilter - The currently selected country name, or 'all'.
   * @param query - The normalised search string.
   * @param sportNameMatches - Whether the sport name itself already satisfies the query.
   */
  private resolveSlot(winner: DisciplineWinner, countryFilter: string, query: string,
                      sportNameMatches: boolean): DisciplineWinner | null {
    if (countryFilter !== 'all' && winner.countryName !== countryFilter) return null;

    if (!sportNameMatches) {
      const winnerMatches: boolean =
        winner.name.toLowerCase().includes(query) ||
        winner.countryName.toLowerCase().includes(query);
      if (!winnerMatches) return null;
    }

    return winner;
  }

  /**
   * Handles a submitted discipline result from the modal.
   *
   * @param {DisciplineResultForm} form - The submitted discipline result form data.
   */
  protected onSubmitDisciplineResult(form: DisciplineResultForm): void {
    console.log('Discipline result submitted:', form);
    // TODO: call backend service, reload data, show alert
  }

  /**
   * Marks a medal slot as locally deleted so it disappears from the grid immediately.
   * The actual API call will be added later.
   *
   * @param {string} rawName - The raw sport identifier of the discipline card.
   * @param {'gold' | 'silver' | 'bronze'} medal - The medal rank to remove.
   */
  protected onDeleteWinner(rawName: string, medal: 'gold' | 'silver' | 'bronze'): void {
    // TODO: call backend delete endpoint
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
   * TODO: AthleteForm doesnt use medals / besttime and sports anymore
   *
   * @param {AthleteForm} form - The new athlete form data.
   */
  protected onAddAthleteFromDiscipline(form: AthleteForm): void {
    const { firstName, lastName, countryId } = this.splitNameAndCountry(form);
    this.athleteService.createAthlete({
      firstName, lastName, countryId,
      goldMedals: form.goldMedals, silverMedals: form.silverMedals, bronzeMedals: form.bronzeMedals,
      bestTime: form.bestTime || null, sport: form.sportRawName, scoreType: form.scoreType,
    }).subscribe({
      next: (created: any): void => {
        // Patch the suspended snapshot immediately using the API-returned ID
        // so the new athlete is pre-selected when the discipline modal re-opens.
        const newId: number = created?.id ?? 0;
        this.suspendedDisciplineForm.update(f => f && newId
          ? { ...f, athleteId: newId, athleteName: form.name }
          : f
        );

        this.dataService.load(); // TODO: avoid reloading all data, only athletes
        this.isAthleteModalOpen.set(false);
        this.suspendedAthleteForm.set(null);
        this.alertService.success(
          this.translateService.instant('ALERT.ATHLETE.ADD').replace('[name]', form.name));

        // Open after a short delay so the data reload has settled.
        setTimeout((): void => {
          this.isDisciplineModalOpen.set(true);
        }, 150);
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
   * Handles adding a new country from within the discipline → athlete → country chain.
   *
   * @param {CountryForm} form - The country form data.
   */
  protected onAddCountryFromDiscipline(form: CountryForm): void {
    this.countryService.createCountry({ code: form.countryCode.toUpperCase(), name: form.countryName }).subscribe({
      next: (): void => {
        this.dataService.load(); // TODO: Avoid loading all data again, only countries
        this.isCountryModalOpen.set(false);
        this.alertService.success(
          this.translateService.instant('ALERT.COUNTRY.ADD').replace('[name]', form.countryName));

        const suspended: AthleteForm | null = this.suspendedAthleteForm();
        if (!suspended) { this.suspendedAthleteForm.set(null); return; }

        const resumeForm: AthleteForm = {
          ...suspended, countryName: form.countryName, countryCode: form.countryCode.toUpperCase()
        };

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
