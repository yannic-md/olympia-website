import {computed, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {HttpErrorResponse} from "@angular/common/http";
import {V2Athlete} from "../../types/Athlete";
import {CountryStats, V2Country} from "../../types/Country";
import {ApiService} from "../api/api.service";
import {AlertService} from "../api/alert/alert.service";
import {TranslateService} from "@ngx-translate/core";
import {LeaderboardResponse} from "../../types/API";
import {V2Sport} from "../../types/Disciplines";

@Injectable({ providedIn: 'root' })
export class DataHolderService {
  readonly leaderboardData: WritableSignal<LeaderboardResponse | null> = signal<LeaderboardResponse | null>(null);
  readonly countriesData: WritableSignal<CountryStats[]> = signal<CountryStats[]>([]);
  readonly sports: WritableSignal<V2Sport[]> = signal<V2Sport[]>([]);
  readonly athletes: WritableSignal<V2Athlete[]> = signal<V2Athlete[]>([]);

  readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);

  /** Sorted list of unique country names derived from countriesData. */
  readonly countries: Signal<string[]> = computed((): string[] =>
    this.countriesData().map(c => c.countryName).sort((a, b): number => a.localeCompare(b))
  );

  constructor(private apiService: ApiService, private alertService: AlertService,
              private translateService: TranslateService) {}

  /**
   * Loads the full leaderboard in a single request and maps the response
   * into the existing V2Athlete / CountryStats signals so all views keep working.
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
        this.athletes.set(data.athletes);
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

