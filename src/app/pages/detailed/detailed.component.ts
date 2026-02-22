import {Component, computed, OnDestroy, Signal, signal, WritableSignal} from '@angular/core';
import {HeaderComponent} from "../../layout/sections/header/header.component";
import {BreadcrumbComponent} from "../../layout/sections/breadcrumb/breadcrumb.component";
import {FormsModule} from "@angular/forms";
import {FooterComponent} from "../../layout/sections/footer/footer.component";
import {NgOptimizedImage} from "@angular/common";
import {FilterSelectComponent} from "../../layout/elements/filter-select/filter-select.component";
import {TableCountryBadgeComponent} from "../../layout/elements/table-country-badge/table-country-badge.component";
import {TableMedalPillsComponent} from "../../layout/elements/table-medal-pills/table-medal-pills.component";
import {TableActionsComponent} from "../../layout/elements/table-actions/table-actions.component";
import {ModalAthleteComponent} from "../../layout/sections/modal/modal-athlete/modal-athlete.component";
import {MiscService} from "../../services/misc/misc.service";
import {AlertBoxComponent} from "../../layout/sections/alert-box/alert-box.component";
import {ModalCountryComponent} from "../../layout/sections/modal/modal-country/modal-country.component";
import {CountryForm, CountryStats} from "../../types/Country";
import {Athlete, AthleteForm} from "../../types/Athlete";
import {LeaderboardService} from "../../services/api/leaderboard/leaderboard.service";
import {HttpErrorResponse} from "@angular/common/http";
import {AlertService} from "../../services/api/alert/alert.service";
import {AuthService} from "../../services/api/auth/auth.service";
import {AthleteService} from "../../services/api/athlete/athlete.service";
import {CountryService} from "../../services/api/country/country.service";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {Subscription, forkJoin, skip} from "rxjs";
import {SportsService, SportEntry} from "../../services/api/sports/sports.service";

@Component({
  selector: 'app-detailed',
  imports: [
    HeaderComponent,
    BreadcrumbComponent,
    FormsModule,
    FooterComponent,
    FilterSelectComponent,
    NgOptimizedImage,
    TableCountryBadgeComponent,
    TableMedalPillsComponent,
    TableActionsComponent,
    ModalAthleteComponent,
    AlertBoxComponent,
    ModalCountryComponent,
    TranslatePipe
  ],
  templateUrl: './detailed.component.html',
  styleUrl: './detailed.component.css',
})
export class DetailedComponent implements OnDestroy {
  protected selectedView: WritableSignal<'athletes' | 'countries'> = signal<'athletes' | 'countries'>('athletes');
  protected filterCountry: WritableSignal<string> = signal<string>('all');
  protected filterSport: WritableSignal<string> = signal<string>('all');
  protected filterMedal: WritableSignal<'all' | 'gold' | 'silver' | 'bronze'> = signal<'all' | 'gold' | 'silver' | 'bronze'>('all');
  protected searchQuery: WritableSignal<string> = signal<string>('');

  protected editingAthlete: WritableSignal<Athlete | null> = signal(null);
  protected editingCountry: WritableSignal<CountryStats | null> = signal(null);
  protected isAthleteModalOpen: WritableSignal<boolean> = signal(false);
  protected isCountryModalOpen: WritableSignal<boolean> = signal(false);
  private readonly translateSub: Subscription;

  protected athletes: WritableSignal<Athlete[]> = signal<Athlete[]>([]);
  protected countriesData: WritableSignal<CountryStats[]> = signal<CountryStats[]>([]);
  protected countries: Signal<string[]> = computed((): string[] => this.countriesData()
    .map(c => c.countryName).sort((a, b): number => a.localeCompare(b)));
  protected sports: WritableSignal<SportEntry[]> = signal([]);

  protected isLoading: WritableSignal<boolean> = signal(false);

  constructor(protected miscService: MiscService, protected leaderboardService: LeaderboardService,
              private alertService: AlertService, protected authService: AuthService,
              private athleteService: AthleteService, private countryService: CountryService,
              private translateService: TranslateService, private sportsService: SportsService) {
    this.loadLeaderboardData();

    this.translateSub = this.translateService.onLangChange.subscribe((): void => {
      this.loadLeaderboardData();
    });
  }

  /**
   * Unsubscribes from the translation language change observable to prevent memory leaks on component destruction.
   * */
  ngOnDestroy(): void {
    if (this.translateSub) { this.translateSub.unsubscribe(); }
  }

  /**
   * Loads leaderboard data, all athletes and all countries from the backend API.
   * Merges athletes without results and countries without athletes into the displayed data
   * so that newly created entries are visible even if they have no results yet.
   * When not logged in, only the public leaderboard data is loaded.
   */
  private loadLeaderboardData(): void {
    const lang: string = this.translateService.getCurrentLang() || 'en';
    if (this.isLoading()) { return; } // avoid duplicate requests
    this.isLoading.set(true);

    if (this.authService.isLoggedIn()) {
      forkJoin({leaderboard: this.leaderboardService.getLeaderboard(), allAthletes: this.athleteService.getAllAthletes(),
                allCountries: this.countryService.getAllCountries(), allSports: this.sportsService.getAllSports(lang)
      }).subscribe({
        next: ({ leaderboard, allAthletes, allCountries, allSports }): void => {
          this.sports.set(allSports);
          this.mergeData(leaderboard, allAthletes, allCountries);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse): void => {
          console.error('Error loading data:', error);
          this.alertService.error(this.translateService.instant('ALERT.ERROR'));
          this.isLoading.set(false);
        }
      });
    } else {
      forkJoin({leaderboard: this.leaderboardService.getLeaderboard(), allSports: this.sportsService.getAllSports(lang)
      }).subscribe({
        next: ({ leaderboard, allSports }): void => {
          this.sports.set(allSports);
          this.athletes.set(leaderboard);
          this.initializeCountriesFromAthletes([]);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse): void => {
          console.error('Error loading leaderboard data:', error);
          this.alertService.error(this.translateService.instant('ALERT.ERROR'));
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Merges leaderboard athletes with all athletes and all countries from the API.
   * Ensures athletes without results and countries without athletes appear in the UI.
   */
  private mergeData(leaderboard: Athlete[], allAthletes: any[], allCountries: any[]): void {
    const athleteMap = new Map<number, Athlete>();
    leaderboard.forEach(a => athleteMap.set(a.id, a));

    allAthletes.forEach((a: any): void => {
      if (!athleteMap.has(a.id)) {
        athleteMap.set(a.id, {id: a.id, name: `${a.firstName} ${a.lastName}`, countryId: a.country?.id ?? 0,
                              countryCode: a.country?.code ?? '', countryName: a.country?.name ?? '', sport: a.sport ?? '',
                              sportRawName: a.sport ?? '', scoreType: a.scoreType ?? null,
                              medals: { gold: 0, silver: 0, bronze: 0 }, bestTime: null});
      } else {
        const existing: Athlete = athleteMap.get(a.id)!;

        if (!existing.sport && a.sport) { existing.sport = a.sport; }
        if (a.sport) { existing.sportRawName = a.sport; }
        if (a.scoreType) { existing.scoreType = a.scoreType; }
        athleteMap.set(a.id, existing);
      }
    });

    this.athletes.set(Array.from(athleteMap.values()));
    this.initializeCountriesFromAthletes(allCountries);
  }

  /**
   * Computed signal that transforms the currently selected athlete into an `AthleteForm` model.
   *
   * This ensures that the edit form always receives a consistent and type-safe data structure
   * whenever `editingAthlete` changes.
   */
  protected athleteEditData: Signal<any> = computed((): AthleteForm | null => {
    const athlete: Athlete | null = this.editingAthlete();
    if (!athlete) return null;

    // Strip unit suffixes so the input field shows the raw numeric/time value
    const rawBestTime: string = (athlete.bestTime || '').replace(/\s*pts$/i, '').replace(/\s*wins$/i, '')
                                                        .replace(/\s*(Siege|Punkte|Victoires|Points)$/i, '').trim();

    return { id: athlete.id, name: athlete.name, countryCode: athlete.countryCode, countryName: athlete.countryName,
             sport: athlete.sport, sportRawName: athlete.sportRawName, scoreType: athlete.scoreType,
             goldMedals: athlete.medals.gold, silverMedals: athlete.medals.silver,
             bronzeMedals: athlete.medals.bronze, bestTime: rawBestTime };
  });

  /**
   * Computed signal that transforms the currently selected country into an `CountryForm` model.
   *
   * This ensures that the edit form always receives a consistent and type-safe data structure
   * whenever `editingCountry` changes.
   */
  protected countryEditData: Signal<any> = computed((): CountryForm | null => {
    const country: CountryStats | null = this.editingCountry();
    if (!country) return null;

    return { countryCode: country.countryCode, countryName: country.countryName, goldMedals: country.medals.gold,
             silverMedals: country.medals.silver, bronzeMedals: country.medals.bronze };
  });

  /**
   * Deletes an athlete from the list by their ID.
   *
   * @param {number} athleteId - The unique ID of the athlete to delete.
   */
  protected onDeleteAthlete(athleteId: number): void {
    const athlete: Athlete | undefined = this.athletes().find(a => a.id === athleteId);
    if (!athlete) return;

    this.athleteService.deleteAthlete(athleteId).subscribe({
      next: (): void => {
        this.athletes.update(current => current.filter(a => a.id !== athleteId));
        this.alertService.success(
          (this.translateService.instant('ALERT.ATHLETE.DELETE')).replace('[name]', athlete.name));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error deleting athlete:', error);
        this.alertService.error(
          (this.translateService.instant('ALERT.ATHLETE.DELETE.ERROR')).replace('[name]', athlete.name));
      }
    });
  }

  /**
   * Opens the modal to edit an athlete from the list by their object.
   *
   * @param {Athlete} athlete - The object of the athlete.
   */
  protected onEditAthlete(athlete: Athlete): void {
    this.editingAthlete.set(athlete);
    this.isAthleteModalOpen.set(true);
  }

  /**
   * Updates an existing athlete in the list with the provided form data.
   *
   * Finds the athlete by ID and replaces its properties with the new values from the form.
   * Closes the edit modal and displays a success alert after updating.
   * Ensures the country code is stored in uppercase and best time is set to null if empty.
   *
   * @param {AthleteForm} form - The form data containing updated athlete information.
   */
  protected onUpdateAthlete(form: AthleteForm): void {
    if (!form.id) return;

    const nameParts: string[] = form.name.trim().split(/\s+/);
    const firstName: string = nameParts[0] || '';
    const lastName: string = nameParts.slice(1).join(' ') || '';
    const country: CountryStats | undefined = this.countriesData().find(c => c.countryName === form.countryName);
    const countryId: number = country ? country.countryId : 0;

    this.athleteService.updateAthlete(form.id, { firstName, lastName, countryId,
      goldMedals: form.goldMedals, silverMedals: form.silverMedals, bronzeMedals: form.bronzeMedals,
      bestTime: form.bestTime || null, sport: form.sportRawName, scoreType: form.scoreType }).subscribe({
      next: (): void => {
        this.loadLeaderboardData();
        this.editingAthlete.set(null);
        this.isAthleteModalOpen.set(false);
        this.alertService.success(
          (this.translateService.instant('ALERT.ATHLETE.EDIT')).replace('[name]', form.name));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error updating athlete:', error);
        this.alertService.error(
          (this.translateService.instant('ALERT.ATHLETE.EDIT.ERROR')).replace('[name]', form.name));
      }
    });
  }

  /**
   * Deletes a country from the statistics list by its country id.
   *
   * Finds the country in the current statistics, removes it if present, and displays a success alert.
   * This method ensures that only existing countries are deleted and provides user feedback.
   *
   * @param {number} countryId - The unique ID of the country.
   */
  protected onDeleteCountry(countryId: number): void {
    const country: CountryStats | undefined = this.countriesData().find(c => c.countryId === countryId);
    if (!country) return;

    this.countryService.deleteCountry(countryId).subscribe({
      next: (): void => {
        this.countriesData.update(current => current.filter(c => c.countryId !== countryId));
        this.athletes.update(current => current.filter(a => a.countryId !== countryId));
        this.alertService.success(
          (this.translateService.instant('ALERT.COUNTRY.DELETE')).replace('[name]', country.countryName));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error deleting athlete:', error);
        this.alertService.error(
          (this.translateService.instant('ALERT.COUNTRY.DELETE.ERROR')).replace('[name]', country.countryName));
      }
    });
  }

  /**
   * Opens the modal to edit an country from the list by their object.
   *
   * @param {CountryStats} country - The object of the country.
   */
  protected onEditCountry(country: CountryStats): void {
    this.editingCountry.set(country);
    this.isCountryModalOpen.set(true);
  }

  /**
   * Updates an existing country in the list with the provided form data.
   *
   * Finds the country by CountryCode and replaces its properties with the new values from the form.
   * Closes the edit modal and displays a success alert after updating.
   * Ensures the country code is stored in uppercase and best time is set to null if empty.
   *
   * @param {CountryForm} form - The form data containing updated country information.
   */
  protected onUpdateCountry(form: CountryForm): void {
    const country: CountryStats | null = this.editingCountry();
    if (!country) return;

    this.countryService.updateCountry(country.countryId, { code: form.countryCode, name: form.countryName }).subscribe({
      next: (): void => {
        this.countriesData.update(current =>
          current.map(c => c.countryId === country.countryId ? { ...c, countryCode: form.countryCode,
                                                                             countryName: form.countryName,
                                                                             medals: { gold: form.goldMedals,
                                                                                       silver: form.silverMedals,
                                                                                       bronze: form.bronzeMedals}} : c)
        );

        this.athletes.update(current =>
          current.map(a => a.countryId === country.countryId
            ? { ...a, countryCode: form.countryCode.toUpperCase(), countryName: form.countryName }
            : a)
        );

        this.editingCountry.set(null);
        this.isCountryModalOpen.set(false);
        this.alertService.success(
          (this.translateService.instant('ALERT.COUNTRY.EDIT')).replace('[name]', form.countryName));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error updating country:', error);
        this.alertService.error(
          (this.translateService.instant('ALERT.COUNTRY.EDIT.ERROR')).replace('[name]', form.countryName));
      }
    });
  }

  /**
   * Computes and returns a filtered and sorted list of athletes based on current filter and search criteria.
   *
   * This computed signal evaluates the list of athletes by applying search text, country, and sport filters.
   * The resulting list is then sorted, prioritizing the selected medal type if specified, followed by gold, silver,
   * and bronze medal counts, and finally alphabetically by name.
   *
   * @returns {Signal<Athlete[]>} A signal containing the filtered and sorted array of athletes.
   */
  protected filteredAthletes: Signal<Athlete[]> = computed((): Athlete[] => {
    const filtered: Athlete[] = this.athletes().filter((athlete: Athlete): boolean => {
      const matchesSearchText: boolean = athlete.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        athlete.countryName.toLowerCase().includes(this.searchQuery().toLowerCase());

      const matchesCountryFilter: boolean = this.filterCountry() === 'all' ||
        athlete.countryName === this.filterCountry();

      const matchesSportsFilter: boolean = this.filterSport() === 'all' || athlete.sportRawName === this.filterSport();
      return matchesSearchText && matchesCountryFilter && matchesSportsFilter;
    });

    // list is sorted by medal amount & alphabet
    return filtered.sort((a, b): number => this.sortByMedals(a, b, a.name, b.name));
  });

  /**
   * Computes and returns filtered country list based on filtered athletes.
   *
   * This computed signal processes the filtered athlete list and aggregates medal counts per country.
   * It creates a map of countries with their respective total gold, silver, and bronze medals earned by all athletes
   * from that country. The resulting list is sorted by medal counts (prioritizing the selected medal filter) and
   * alphabetically by country name.
   *
   * @returns {Signal<CountryStats[]>} A signal containing the aggregated and sorted array of country statistics.
   */
  protected filteredCountries: Signal<CountryStats[]> = computed((): CountryStats[] => {
    return this.countriesData()
      .filter(country => {
        const matchesSearch = country.countryName.toLowerCase()
          .includes(this.searchQuery().toLowerCase());

        const matchesCountryFilter = this.filterCountry() === 'all' ||
          country.countryName === this.filterCountry();

        return matchesSearch && matchesCountryFilter;
      }).sort((a, b): number => this.sortByMedals(a, b, a.countryName, b.countryName));
  });

  /**
   * Initializes the countries data by aggregating medal counts from all athletes
   * and merging in countries from the API that have no athletes yet.
   *
   * @param allCountries - List of all countries from the backend API
   */
  private initializeCountriesFromAthletes(allCountries: any[]): void {
    const countryMap = new Map<string, CountryStats>();

    this.athletes().forEach(athlete => {
      if (!athlete.countryCode) return;
      if (!countryMap.has(athlete.countryCode)) {
        countryMap.set(athlete.countryCode, { countryCode: athlete.countryCode, countryName: athlete.countryName,
                                              medals: { gold: 0, silver: 0, bronze: 0 }, countryId: athlete.countryId });
      }

      const stat: CountryStats = countryMap.get(athlete.countryCode)!;
      stat.medals.gold += athlete.medals.gold;
      stat.medals.silver += athlete.medals.silver;
      stat.medals.bronze += athlete.medals.bronze;
    });

    // Add countries without athletes from /api/countries
    allCountries.forEach((c: any) => {
      if (!countryMap.has(c.code)) {
        countryMap.set(c.code, { countryCode: c.code, countryName: c.name,
                                 medals: { gold: 0, silver: 0, bronze: 0 }, countryId: c.id });
      }
    });

    this.countriesData.set(Array.from(countryMap.values()));
  }

  /**
   * Sorts two objects by their medal counts, prioritizing a specific medal type if filtered, then by total medals,
   * and finally alphabetically by name.
   *
   * This method first checks if a specific medal type filter is active. If so, it sorts by that medal type in descending order.
   * Otherwise, it sorts by gold, silver, and bronze medals in that priority order (descending).
   * If all medal counts are equal, it falls back to alphabetical comparison of the provided names.
   *
   * @param {object} a - First object containing medal counts (gold, silver, bronze).
   * @param {object} b - Second object containing medal counts (gold, silver, bronze).
   * @param {string} nameA - Name of the first object for alphabetical fallback sorting.
   * @param {string} nameB - Name of the second object for alphabetical fallback sorting.
   * @returns {number} Negative if a should come first, positive if b should come first, zero if equal.
   */
  private sortByMedals(a: { medals: { gold: number; silver: number; bronze: number } },
                       b: { medals: { gold: number; silver: number; bronze: number } }, nameA: string, nameB: string): number {
    if (this.filterMedal() !== 'all') {
      const medalType: 'gold' | 'silver' | 'bronze' = this.filterMedal() as 'gold' | 'silver' | 'bronze';
      const medalComparison: number = b.medals[medalType] - a.medals[medalType];
      if (medalComparison !== 0) return medalComparison;
    }

    if (a.medals.gold !== b.medals.gold) return b.medals.gold - a.medals.gold;
    if (a.medals.silver !== b.medals.silver) return b.medals.silver - a.medals.silver;
    if (a.medals.bronze !== b.medals.bronze) return b.medals.bronze - a.medals.bronze;

    return nameA.localeCompare(nameB);
  }

  /**
   * Handles the creation and addition of a new athlete to the list.
   *
   * Sends a create request to the backend API, then reloads leaderboard data to reflect the new athlete.
   * Closes the modal dialog and displays a success or error alert.
   *
   * @param {AthleteForm} form - The form data containing athlete information.
   */
  protected onAddAthlete(form: AthleteForm): void {
    const nameParts: string[] = form.name.trim().split(/\s+/);
    const firstName: string = nameParts[0] || '';
    const lastName: string = nameParts.slice(1).join(' ') || '';
    const country: CountryStats | undefined = this.countriesData().find(c => c.countryName === form.countryName);
    const countryId: number = country ? country.countryId : 0;

    this.athleteService.createAthlete({ firstName, lastName, countryId,
      goldMedals: form.goldMedals, silverMedals: form.silverMedals, bronzeMedals: form.bronzeMedals,
      bestTime: form.bestTime || null, sport: form.sportRawName, scoreType: form.scoreType }).subscribe({
      next: (): void => {
        this.loadLeaderboardData();
        this.isAthleteModalOpen.set(false);
        this.alertService.success(
          (this.translateService.instant('ALERT.ATHLETE.ADD')).replace('[name]', form.name));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error creating athlete:', error);
        this.alertService.error(
          (this.translateService.instant('ALERT.ATHLETE.ADD.ERROR')).replace('[name]', form.name));
      }
    });
  }

  /**
   * Handles the creation and addition of a new country to the statistics list.
   *
   * Sends a create request to the backend API if the country does not already exist.
   * The country code is converted to uppercase before checking for duplicates. After processing, the modal
   * is closed and a success or error alert is displayed.
   *
   * @param {Object} form - The form data containing country information.
   * @param {string} form.countryCode - The ISO country code (will be converted to uppercase).
   * @param {string} form.countryName - The full country name.
   * @param {number} form.goldMedals - Number of gold medals for the country.
   * @param {number} form.silverMedals - Number of silver medals for the country.
   * @param {number} form.bronzeMedals - Number of bronze medals for the country.
   */
  protected onAddCountry(form: { countryCode: string; countryName: string;
                                 goldMedals: number; silverMedals: number; bronzeMedals: number;}): void {
    this.countryService.createCountry({ code: form.countryCode.toUpperCase(), name: form.countryName }).subscribe({
      next: (): void => {
        this.loadLeaderboardData();
        this.isCountryModalOpen.set(false);
        this.alertService.success(
          (this.translateService.instant('ALERT.COUNTRY.ADD')).replace('[name]', form.countryName));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error creating country:', error);
        this.alertService.error(
          (this.translateService.instant('ALERT.COUNTRY.EDIT.ERROR')).replace('[name]', form.countryName));
      }
    });
  }

}
