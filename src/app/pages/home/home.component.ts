import {Component, OnDestroy, signal, WritableSignal} from '@angular/core';
import {HeaderComponent} from "../../layout/sections/header/header.component";
import {BreadcrumbComponent} from "../../layout/sections/breadcrumb/breadcrumb.component";
import {NgClass, NgOptimizedImage} from "@angular/common";
import {FooterComponent} from "../../layout/sections/footer/footer.component";
import {RouterLink} from "@angular/router";
import {MiscService} from "../../services/misc/misc.service";
import {AlertBoxComponent} from "../../layout/sections/alert-box/alert-box.component";
import {Athlete} from "../../types/Athlete";
import {HttpErrorResponse} from "@angular/common/http";
import {AlertService} from "../../services/api/alert/alert.service";
import {LeaderboardService} from "../../services/api/leaderboard/leaderboard.service";
import {TableMedalPillsComponent} from "../../layout/elements/table-medal-pills/table-medal-pills.component";
import {FilterSelectComponent} from "../../layout/elements/filter-select/filter-select.component";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {Subscription} from "rxjs";

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
  protected topCountries: MedalWinner[] = [];
  protected filterSport: WritableSignal<string> = signal('all');
  private readonly translateSub: Subscription;
  private isLoading: WritableSignal<boolean> = signal(false);

  constructor(protected miscService: MiscService, private leaderboardService: LeaderboardService,
              private alertService: AlertService, private translateService: TranslateService) {
    this.translateSub = this.translateService.onLangChange.subscribe((): void => {
      this.loadTopCountries();
    });
  }

  /**
   * Unsubscribes from the translation language change observable to prevent memory leaks on component destruction.
   * */
  ngOnDestroy(): void {
    if (this.translateSub) { this.translateSub.unsubscribe(); }
  }

  /**
   * Fetches leaderboard data and computes the top 6 countries by total medal count.
   * Countries are sorted by gold, silver, then bronze medals descending.
   */
  private loadTopCountries(): void {
    if (this.isLoading()) { return; } // avoid duplicate requests
    this.isLoading.set(true);

    this.leaderboardService.getLeaderboard().subscribe({
      next: (athletes: Athlete[]): void => {
        this.topCountries = this.buildTopCountries(athletes);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error loading leaderboard data:', error);
        this.alertService.error(this.translateService.instant('ALERT.ERROR'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Aggregates medal counts per country from athlete data and returns the top 10 entries.
   *
   * @param {Athlete[]} athletes - List of athletes from the leaderboard API.
   * @returns {MedalWinner[]} Top 10 countries sorted by gold, silver, bronze descending.
   */
  private buildTopCountries(athletes: Athlete[]): MedalWinner[] {
    const countryMap = new Map<string, MedalWinner>();

    athletes.forEach((athlete: Athlete): void => {
      if (!countryMap.has(athlete.countryCode)) {
        countryMap.set(athlete.countryCode, { rank: 0, countryName: athlete.countryName, errorFlag: false,
                                              countryCode: athlete.countryCode.toLowerCase(),
                                              gold: 0, silver: 0, bronze: 0 });
      }

      const entry: MedalWinner = countryMap.get(athlete.countryCode)!;
      entry.gold += athlete.medals.gold;
      entry.silver += athlete.medals.silver;
      entry.bronze += athlete.medals.bronze;
    });

    return Array.from(countryMap.values())
      .sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

}
