import {Component, computed, Inject, OnDestroy, PLATFORM_ID, Signal, signal, WritableSignal} from '@angular/core';
import {HeaderComponent} from "../../layout/sections/header/header.component";
import {BreadcrumbComponent} from "../../layout/sections/breadcrumb/breadcrumb.component";
import {isPlatformBrowser, NgClass, NgOptimizedImage} from "@angular/common";
import {FooterComponent} from "../../layout/sections/footer/footer.component";
import {RouterLink} from "@angular/router";
import {MiscService} from "../../services/misc/misc.service";
import {AlertBoxComponent} from "../../layout/sections/alert-box/alert-box.component";
import {HttpErrorResponse} from "@angular/common/http";
import {AlertService} from "../../services/api/alert/alert.service";
import {TableMedalPillsComponent} from "../../layout/elements/table-medal-pills/table-medal-pills.component";
import {FilterSelectComponent} from "../../layout/elements/filter-select/filter-select.component";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {Subscription} from 'rxjs';
import {ApiService} from "../../services/api/api.service";
import {V2Sport} from "../../types/Disciplines";
import {V2Country} from "../../types/Country";
import {LeaderboardResponse} from "../../types/API";

interface MedalWinner {
  rank: number;
  countryName: string;
  countryCode: string;
  gold: number;
  silver: number;
  bronze: number;
  errorFlag: boolean;
}

@Component({
  selector: 'app-home',
  imports: [
    HeaderComponent,
    BreadcrumbComponent,
    NgOptimizedImage,
    FooterComponent,
    RouterLink,
    AlertBoxComponent,
    TableMedalPillsComponent,
    NgClass,
    TranslatePipe,
    FilterSelectComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnDestroy {
  protected filterSport: WritableSignal<string> = signal('all');
  protected isLoading: WritableSignal<boolean> = signal(false);
  protected skipEntryAnimation: boolean = false;
  private allCountries: WritableSignal<V2Country[]> = signal<V2Country[]>([]);
  protected allSports: WritableSignal<V2Sport[]> = signal<V2Sport[]>([]);
  private readonly translateSub: Subscription | undefined;
  private dataSub: Subscription | undefined;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
              protected miscService: MiscService, private apiService: ApiService,
              private alertService: AlertService, private translateService: TranslateService) {
    if (isPlatformBrowser(this.platformId)) {
      // Don't replay the animation after an in-app route change – only on the initial page load.
      this.skipEntryAnimation = document.readyState === 'complete';
    }

    this.loadData();
    this.translateSub = this.translateService.onLangChange.subscribe((): void => {
      this.loadData();
    });
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Unsubscribes from the translation language change stream to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.translateSub) { this.translateSub.unsubscribe(); }
    if (this.dataSub) { this.dataSub.unsubscribe(); }
  }

  /**
   * Reactive computed signal that produces the top-10 {@link MedalWinner} list
   * displayed in the home page grid.
   *
   * When no sport filter is active (`'all'`), the pre-aggregated, backend-ranked
   * country data is used directly. When a specific sport is selected, medals are
   * counted from that sport's participant list and countries are ranked on the fly.
   *
   * Re-evaluates automatically whenever {@link filterSport}, {@link allCountries}
   * or {@link allSports} change.
   */
  protected topCountries: Signal<MedalWinner[]> = computed<MedalWinner[]>(() => {
    const sport: string = this.filterSport();
    return sport === 'all' ? this.buildOverallTop10() : this.buildTop10ForSport(sport);
  });

  /**
   * Builds the top-10 list using the pre-aggregated medal totals from the V2
   * country endpoint. The backend already applies the correct GOLD → SILVER →
   * BRONZE tiebreaker and assigns `leaderboardRank`.
   *
   * @returns Up to 10 {@link MedalWinner} entries sorted by `leaderboardRank` ascending.
   */
  private buildOverallTop10(): MedalWinner[] {
    return this.allCountries().slice(0, 10)
      .map((c: V2Country, i: number): MedalWinner => ({
        rank:        c.leaderboardRank ?? i + 1,
        countryName: c.name,
        countryCode: c.code.toLowerCase(),
        gold:        c.medals.gold,
        silver:      c.medals.silver,
        bronze:      c.medals.bronze,
        errorFlag:   false,
      })).sort((a: MedalWinner, b: MedalWinner): number => a.rank - b.rank);
  }

  /**
   * Builds a top-10 list scoped to a single sport by iterating over the sport's
   * participant list and accumulating medal counts per country code.
   *
   * Countries that won no medal in the selected sport are excluded. The result
   * is sorted GOLD → SILVER → BRONZE descending and ranked from 1.
   *
   * @param sportRawName - The `rawName` of the sport to filter by.
   * @returns Up to 10 {@link MedalWinner} entries, or an empty array when the
   *          sport is not found or no medalists exist.
   */
  private buildTop10ForSport(sportRawName: string): MedalWinner[] {
    const selectedSport: V2Sport | undefined =
      this.allSports().find((s: V2Sport): boolean => s.rawName === sportRawName);

    if (!selectedSport) { return []; }
    const countryMedals: Map<string, MedalWinner> = this.aggregateMedalsByCountry(selectedSport);

    return Array.from(countryMedals.values())
      .filter((c: MedalWinner): boolean => c.gold + c.silver + c.bronze > 0)
      .sort((a: MedalWinner, b: MedalWinner): number =>
        b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze
      ).slice(0, 10)
      .map((entry: MedalWinner, index: number): MedalWinner => ({ ...entry, rank: index + 1 }));
  }

  /**
   * Iterates over all participants of a sport and accumulates their medal
   * counts into a `Map` keyed by lower-cased country code.
   *
   * Participants without a medal or without a country code are skipped.
   *
   * @param sport - The V2 sport whose participant list is to be aggregated.
   * @returns A `Map<countryCode, MedalWinner>` with running medal totals.
   */
  private aggregateMedalsByCountry(sport: V2Sport): Map<string, MedalWinner> {
    const countryMedals = new Map<string, MedalWinner>();

    sport.participants.forEach((p): void => {
      if (!p.medal || !p.countryCode) { return; }

      const key: string = p.countryCode.toLowerCase();

      if (!countryMedals.has(key)) {
        countryMedals.set(key, { rank: 0, countryName: p.countryName ?? p.countryCode, countryCode: key,
                                 gold: 0, silver: 0, bronze: 0, errorFlag: false });
      }

      const entry: MedalWinner = countryMedals.get(key)!;
      switch (p.medal) {
        case 'GOLD':   entry.gold++;   break;
        case 'SILVER': entry.silver++; break;
        case 'BRONZE': entry.bronze++; break;
      }
    });

    return countryMedals;
  }

  /**
   * Fetches countries and sports from the V2 API.
   * Countries carry pre-aggregated medals; sports carry per-participant medal info for filtering.
   */
  private loadData(): void {
    if (this.isLoading()) { return; }
    this.isLoading.set(true);

    this.dataSub = this.apiService.getLeaderboard(this.translateService.getCurrentLang() || 'en').subscribe({
      next: (data: LeaderboardResponse): void => {
        this.allCountries.set(data.countries);
        this.allSports.set(data.sports);

        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error loading home data:', error);
        this.alertService.error(this.translateService.instant('ALERT.ERROR'));
        this.isLoading.set(false);
      }
    });
  }

}
