import {Injectable, WritableSignal} from '@angular/core';
import {DataHolderService} from "../data-holder/data-holder.service";

interface NavigationItem {
  label: string;
  path?: string;
  externalUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MiscService {
  nav_items: NavigationItem[] = [
    { label: 'BREADCRUMB.NAVIGATION.START', path: '/' },
    { label: 'BREADCRUMB.NAVIGATION.DETAILED', path: '/detailed' },
    { label: 'BREADCRUMB.NAVIGATION.LEARNMORE', externalUrl: 'https://www.olympics.com/de/olympic-games/paris-2024' }
  ];

  constructor(private dataService: DataHolderService) {}

  /**
   * Handles backdrop clicks to close the modal when clicking outside the modal content.
   */
  onBackdropClick(event: MouseEvent, close: () => void): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  /**
   * Updates a specific field in a signal-based form data object.
   */
  updateField<T, K extends keyof T>(formSignal: WritableSignal<T>, field: K, value: T[K]): void {
    formSignal.update(current => ({ ...current, [field]: value }));
  }

  /**
   * Returns the 0-based rank of an item in a sorted list by comparing its `id` or `countryId`
   * property against the provided identifier.
   * Intended to display the true rank of a row independently of any active search/text filter.
   *
   * @param {[]} sortedList - The fully sorted list (without text-search filter applied).
   * @param {number} id - The identifier of the item to look up.
   * @param idKey - The property name used as the identifier (e.g. `'id'` or `'countryId'`).
   * @returns {number} The 0-based rank position, or -1 if not found.
   */
  getRankOf<T>(sortedList: T[], id: number, idKey: keyof T): number {
    return sortedList.findIndex(item => item[idKey] === id);
  }

  /**
   * Recalculates and updates the medal totals for a single country in `countriesData`
   * by summing up all athletes currently in the local `athletes` store.
   *
   * @param {number} countryId - The ID of the country to recalculate.
   */
  recalcCountryMedals(countryId: number): void {
    if (!countryId) return;
    const totals = this.dataService.athletes().filter(a => a.countryId === countryId)
      .reduce((acc, a) => ({
        gold:   acc.gold   + (a.medals.gold   ?? 0),
        silver: acc.silver + (a.medals.silver ?? 0),
        bronze: acc.bronze + (a.medals.bronze ?? 0),
      }), { gold: 0, silver: 0, bronze: 0 });

    this.dataService.countriesData.update(list =>
      list.map(c => c.countryId !== countryId ? c : { ...c, medals: totals })
    );
  }

}
