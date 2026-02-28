import {Component, computed, input, InputSignal, Signal, signal, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';
import {DisciplineWinnerRowComponent} from '../../../../layout/elements/discipline-winner-row/discipline-winner-row.component';
import {DataHolderService} from '../../../../services/data-holder/data-holder.service';
import {AuthService} from '../../../../services/api/auth/auth.service';
import {SportEntry} from '../../../../services/api/sports/sports.service';
import {
  DISCIPLINE_RESULTS,
  DisciplineCard,
  DisciplineResult,
  DisciplineWinner,
} from '../../../../types/Disciplines';

@Component({
  selector: 'app-disciplines-view',
  imports: [TranslatePipe, NgOptimizedImage, DisciplineWinnerRowComponent],
  templateUrl: './disciplines-view.component.html',
  styleUrls: ['./disciplines-view.component.css']
})
export class DisciplinesViewComponent {
  filterCountry: InputSignal<string> = input.required<string>();
  filterSport: InputSignal<string> = input.required<string>();
  filterMedal: InputSignal<'all' | 'gold' | 'silver' | 'bronze'> = input.required<'all' | 'gold' | 'silver' | 'bronze'>();
  searchQuery: InputSignal<string> = input.required<string>();

  /** Tracks per-card image load errors by rawName. */
  protected imageErrors: WritableSignal<Set<string>> = signal(new Set<string>());

  constructor(protected dataService: DataHolderService, protected authService: AuthService) {}

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
}
