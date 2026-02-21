import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {Athlete} from "../../../types/Athlete";
import {API_URL} from "../../../types/API";
import {TranslateService} from "@ngx-translate/core";

interface LeaderboardEntry {
  resultId: number;
  rank: number;
  athleteId: number;
  athleteName: string;
  countryId: number;
  countryCode: string;
  countryName: string;
  timeOrPoints: string | null;
  medal: 'GOLD' | 'SILVER' | 'BRONZE';
  sportName: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {

  constructor(private http: HttpClient, private translateService: TranslateService) {}

  /**
   * Fetches leaderboard data from the backend and transforms it into athletes with aggregated medal counts.
   *
   * @returns {Observable<Athlete[]>} Observable containing the list of athletes with their medals aggregated.
   */
  getLeaderboard(): Observable<Athlete[]> {
    const currLang: string = this.translateService.getCurrentLang();
    return this.http.get<LeaderboardEntry[]>(API_URL + `/public/leaderboard?lang=${currLang}`).pipe(
      map(entries => this.transformToAthletes(entries))
    );
  }

  /**
   * Transforms leaderboard entries into a list of athletes with aggregated medal counts.
   * Groups results by athlete name and country, then counts medals per type.
   *
   * @param {LeaderboardEntry[]} entries - Raw leaderboard data from API.
   * @returns {Athlete[]} Array of athletes with aggregated medal information.
   */
  private transformToAthletes(entries: LeaderboardEntry[]): Athlete[] {
    const athleteMap = new Map<string, Athlete>();

    entries.forEach((entry, _index): void => {
      const key = `${entry.athleteName}-${entry.countryCode}`;
      if (entry.timeOrPoints !== null) {
        entry.timeOrPoints = entry.timeOrPoints
          .replace("wins", this.translateService.instant('PAGE.DETAILED.TABLE.WINS'))
          .replace("pts", this.translateService.instant('PAGE.DETAILED.TABLE.POINTS'))
      }

      if (!athleteMap.has(key)) {
        athleteMap.set(key, { id: entry.athleteId, name: entry.athleteName, countryId: entry.countryId,
                              countryCode: entry.countryCode, countryName: entry.countryName, sport: entry.sportName,
                              medals: { gold: 0, silver: 0, bronze: 0 }, bestTime: entry.timeOrPoints });
      }

      const athlete: Athlete = athleteMap.get(key)!;

      // Aggregate medal counts
      switch (entry.medal) {
        case 'GOLD':
          athlete.medals.gold++;
          break;
        case 'SILVER':
          athlete.medals.silver++;
          break;
        case 'BRONZE':
          athlete.medals.bronze++;
          break;
      }

      // Update best time if current entry is better (shorter time or higher points)
      if (this.isBetterTime(entry.timeOrPoints, athlete.bestTime)) {
        athlete.bestTime = entry.timeOrPoints;
      }
    });

    return Array.from(athleteMap.values());
  }

  /**
   * Compares two time/points values to determine which is better.
   * Points (containing 'pts') are compared numerically (higher is better).
   * Times are compared as durations (lower is better).
   *
   * @param {string} newTime - The new time or points value to compare.
   * @param {string | null} currentBest - The current best time or points value.
   * @returns {boolean} True if newTime is better than currentBest.
   */
  private isBetterTime(newTime: string | null, currentBest: string | null): boolean {
    if (!newTime) return false;
    if (!currentBest) return true;

    // Handle points (higher is better)
    if (newTime.includes('pts') && currentBest.includes('pts')) {
      const newPoints = parseFloat(newTime.replace(' pts', ''));
      const bestPoints = parseFloat(currentBest.replace(' pts', ''));
      return newPoints > bestPoints;
    }

    // Handle time (lower is better)
    const newSeconds = this.timeToSeconds(newTime);
    const bestSeconds = this.timeToSeconds(currentBest);
    return newSeconds < bestSeconds;
  }

  /**
   * Converts a time string to total seconds for comparison.
   * Supports formats: "MM:SS.ms", "H:MM:SS.ms", "SS.ms"
   *
   * @param {string} time - Time string to convert.
   * @returns {number} Total time in seconds.
   */
  private timeToSeconds(time: string): number {
    const parts: string[] = time.split(':');
    if (parts.length === 3) {
      // H:MM:SS.ms format
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      // MM:SS.ms format
      return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    } else {
      // SS.ms format
      return parseFloat(time);
    }
  }
}
