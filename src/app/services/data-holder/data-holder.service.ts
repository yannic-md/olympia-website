import {computed, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {HttpErrorResponse} from "@angular/common/http";
import {Athlete, V2Athlete} from "../../types/Athlete";
import {CountryStats, V2Country} from "../../types/Country";
import {ApiService} from "../api/api.service";
import {AlertService} from "../api/alert/alert.service";
import {TranslateService} from "@ngx-translate/core";
import {LeaderboardResponse} from "../../types/API";
import {V2Sport, V2SportResult} from "../../types/Disciplines";

@Injectable({ providedIn: 'root' })
export class DataHolderService {
  readonly leaderboardData: WritableSignal<LeaderboardResponse | null> = signal<LeaderboardResponse | null>(null);
  readonly countriesData: WritableSignal<CountryStats[]> = signal<CountryStats[]>([]);
  readonly sports: WritableSignal<V2Sport[]> = signal<V2Sport[]>([]);
  readonly athletes: WritableSignal<Athlete[]> = signal<Athlete[]>([]);

  readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);

  /** Sorted list of unique country names derived from countriesData. */
  readonly countries: Signal<string[]> = computed((): string[] =>
    this.countriesData().map(c => c.countryName).sort((a, b): number => a.localeCompare(b))
  );

  constructor(private apiService: ApiService, private alertService: AlertService,
              private translateService: TranslateService) {}

  /**
   * Loads the full leaderboard in a single request and maps the response
   * into the existing Athlete / CountryStats signals so all views keep working.
   * Prevents duplicate in-flight requests via the isLoading guard.
   */
  load(): void {
    const lang: string = this.translateService.getCurrentLang() || 'en';
    if (this.isLoading()) { return; }
    this.isLoading.set(true);

    this.apiService.getLeaderboard(lang).subscribe({
      next: (data: LeaderboardResponse): void => {
        this.isLoading.set(false);

        this.leaderboardData.set(data);
        this.sports.set(data.sports);
        this.athletes.set(this._mapAthletes(data.athletes));
        this.countriesData.set(this._mapCountries(data.countries));
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error loading V2 leaderboard data:', error);
        this.isLoading.set(false);
        this.alertService.error(this.translateService.instant('ALERT.ERROR'));
      }
    });
  }

  /**
   * Maps a list of `V2Athlete` objects to the legacy `Athlete` interface.
   *
   * The first sport result in `a.results` is used to populate the top-level
   * sport-related fields for backward compatibility with existing views.
   *
   * @param {V2Athlete[]} v2Athletes List of athletes from the V2 API response.
   * @returns {Athlete[]} An array of mapped athletes in the legacy `Athlete` format.
   */
  private _mapAthletes(v2Athletes: V2Athlete[]): Athlete[] {
    return v2Athletes.map(a => {
      const firstResult: V2SportResult = a.results?.[0];
      return { id: a.id,  name: `${a.firstName} ${a.lastName}`,  countryId: a.country?.id ?? 0,
               countryCode: a.country?.code ?? '', countryName: a.country?.name ?? '',
               sport: firstResult?.sportName ?? '', sportRawName: firstResult?.sportRawName ?? '',
               scoreType: firstResult?.scoreType ?? null, bestTime: firstResult?.result ?? null,
               medals: { gold: a.medals.gold, silver: a.medals.silver, bronze: a.medals.bronze } };
    });
  }

  /**
   * Maps a list of `V2Country` objects from the V2 API to the legacy `CountryStats` interface.
   *
   * @param {V2Country[]} v2Countries List of countries from the V2 API response.
   * @returns {CountryStats[]} Array of `CountryStats` objects used by legacy views.
   */
  private _mapCountries(v2Countries: V2Country[]): CountryStats[] {
    return v2Countries.map(c => ({
      countryId: c.id, countryCode: c.code, countryName: c.name,
      medals: { gold: c.medals.gold, silver: c.medals.silver, bronze: c.medals.bronze },
      nameEn: c.nameEn, nameDe: c.nameDe, nameFr: c.nameFr
    }));
  }
}

