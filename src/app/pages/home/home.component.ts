import {Component, OnInit} from '@angular/core';
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
    NgClass
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  protected topCountries: MedalWinner[] = [];

  constructor(protected miscService: MiscService, private leaderboardService: LeaderboardService,
              private alertService: AlertService) {}

  /**
   * Initializes the home component by loading the top countries leaderboard data on startup.
   */
  ngOnInit(): void {
    this.loadTopCountries();
  }

  /**
   * Fetches leaderboard data and computes the top 6 countries by total medal count.
   * Countries are sorted by gold, silver, then bronze medals descending.
   */
  private loadTopCountries(): void {
    this.leaderboardService.getLeaderboard().subscribe({
      next: (athletes: Athlete[]): void => {
        this.topCountries = this.buildTopCountries(athletes);
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error loading leaderboard data:', error);
        this.alertService.error('Fehler beim Laden der Daten!');
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
