import {computed, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {HttpErrorResponse} from "@angular/common/http";
import {forkJoin} from "rxjs";
import {Athlete} from "../../types/Athlete";
import {CountryStats} from "../../types/Country";
import {LeaderboardService} from "../api/leaderboard/leaderboard.service";
import {AthleteService} from "../api/athlete/athlete.service";
import {CountryService} from "../api/country/country.service";
import {SportsService, SportEntry} from "../api/sports/sports.service";
import {AlertService} from "../api/alert/alert.service";
import {AuthService} from "../api/auth/auth.service";
import {TranslateService} from "@ngx-translate/core";

@Injectable({ providedIn: 'root' })
export class DataHolderService {
  readonly athletes: WritableSignal<Athlete[]> = signal<Athlete[]>([]);
  readonly countriesData: WritableSignal<CountryStats[]> = signal<CountryStats[]>([]);
  readonly sports: WritableSignal<SportEntry[]> = signal<SportEntry[]>([]);
  readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);

  /** Sorted list of unique country names derived from countriesData. */
  readonly countries: Signal<string[]> = computed((): string[] =>
    this.countriesData().map(c => c.countryName).sort((a, b): number => a.localeCompare(b))
  );

  constructor(private leaderboardService: LeaderboardService, private athleteService: AthleteService,
              private countryService: CountryService, private sportsService: SportsService,
              private alertService: AlertService, private authService: AuthService,
              private translateService: TranslateService) {}

  /**
   * Loads leaderboard data, athletes, countries and sports from the API.
   * When not logged in, only the public leaderboard data and sports are loaded.
   * Prevents duplicate in-flight requests via the isLoading guard.
   */
  load(): void {
    const lang: string = this.translateService.getCurrentLang() || 'en';
    if (this.isLoading()) { return; }
    this.isLoading.set(true);

    if (this.authService.isLoggedIn()) {
      forkJoin({
        leaderboard: this.leaderboardService.getLeaderboard(),
        allAthletes: this.athleteService.getAllAthletes(),
        allCountries: this.countryService.getAllCountries(),
        allSports: this.sportsService.getAllSports(lang),
      }).subscribe({
        next: ({ leaderboard, allAthletes, allCountries, allSports }): void => {
          this.sports.set(allSports);
          this._mergeData(leaderboard, allAthletes, allCountries);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse): void => {
          console.error('Error loading data:', error);
          this.alertService.error(this.translateService.instant('ALERT.ERROR'));
          this.isLoading.set(false);
        }
      });
    } else {
      forkJoin({
        leaderboard: this.leaderboardService.getLeaderboard(),
        allSports: this.sportsService.getAllSports(lang),
      }).subscribe({
        next: ({ leaderboard, allSports }): void => {
          this.sports.set(allSports);
          this.athletes.set(leaderboard);
          this._initializeCountriesFromAthletes([]);
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
   * Merges leaderboard athletes with the full athlete list and all countries from the API.
   * Ensures athletes without results and countries without athletes appear in the UI.
   *
   * @param leaderboard - Athletes returned by the leaderboard endpoint.
   * @param allAthletes - All athletes from the admin endpoint.
   * @param allCountries - All countries from the API.
   */
  private _mergeData(leaderboard: Athlete[], allAthletes: any[], allCountries: any[]): void {
    const athleteMap = new Map<number, Athlete>();
    leaderboard.forEach(a => athleteMap.set(a.id, a));

    allAthletes.forEach((a: any): void => {
      if (!athleteMap.has(a.id)) {
        athleteMap.set(a.id, {
          id: a.id, name: `${a.firstName} ${a.lastName}`,
          countryId: a.country?.id ?? 0, countryCode: a.country?.code ?? '',
          countryName: a.country?.name ?? '', sport: a.sport ?? '',
          sportRawName: a.sport ?? '', scoreType: a.scoreType ?? null,
          medals: { gold: 0, silver: 0, bronze: 0 }, bestTime: null,
        });
      } else {
        const existing: Athlete = athleteMap.get(a.id)!;
        if (!existing.sport && a.sport) { existing.sport = a.sport; }
        if (a.sport) { existing.sportRawName = a.sport; }
        if (a.scoreType) { existing.scoreType = a.scoreType; }
        athleteMap.set(a.id, existing);
      }
    });

    this.athletes.set(Array.from(athleteMap.values()));
    this._initializeCountriesFromAthletes(allCountries);
  }

  /**
   * Initializes the countries data by aggregating medal counts from all athletes
   * and merging in countries from the API that have no athletes yet.
   *
   * @param allCountries - List of all countries from the backend API.
   */
  private _initializeCountriesFromAthletes(allCountries: any[]): void {
    const countryMap = new Map<string, CountryStats>();

    this.athletes().forEach(athlete => {
      if (!athlete.countryCode) return;
      if (!countryMap.has(athlete.countryCode)) {
        countryMap.set(athlete.countryCode, {
          countryCode: athlete.countryCode, countryName: athlete.countryName,
          medals: { gold: 0, silver: 0, bronze: 0 }, countryId: athlete.countryId,
        });
      }
      const stat: CountryStats = countryMap.get(athlete.countryCode)!;
      stat.medals.gold += athlete.medals.gold;
      stat.medals.silver += athlete.medals.silver;
      stat.medals.bronze += athlete.medals.bronze;
    });

    allCountries.forEach((c: any) => {
      if (!countryMap.has(c.code)) {
        countryMap.set(c.code, {
          countryCode: c.code, countryName: c.name,
          medals: { gold: 0, silver: 0, bronze: 0 }, countryId: c.id,
        });
      }
    });

    this.countriesData.set(Array.from(countryMap.values()));
  }
}

