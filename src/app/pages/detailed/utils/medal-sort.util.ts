/**
 * Sorts two medal-bearing objects by their medal counts.
 *
 * Priority order:
 * 1. The actively filtered medal type (if not 'all')
 * 2. Gold → Silver → Bronze medal count (descending)
 * 3. Alphabetical by name (ascending)
 *
 * @param a - First object with a `medals` property.
 * @param b - Second object with a `medals` property.
 * @param nameA - Display name of the first object for alphabetical fallback.
 * @param nameB - Display name of the second object for alphabetical fallback.
 * @param filterMedal - The currently active medal filter.
 * @returns Negative if `a` should come first, positive if `b` should, zero if equal.
 */
export function sortByMedals(a: { medals: { gold: number; silver: number; bronze: number } },
                             b: { medals: { gold: number; silver: number; bronze: number } }, nameA: string,
                             nameB: string, filterMedal: 'all' | 'gold' | 'silver' | 'bronze'): number {
  if (filterMedal !== 'all') {
    const medalComparison: number = b.medals[filterMedal] - a.medals[filterMedal];
    if (medalComparison !== 0) return medalComparison;
  }

  if (a.medals.gold !== b.medals.gold) return b.medals.gold - a.medals.gold;
  if (a.medals.silver !== b.medals.silver) return b.medals.silver - a.medals.silver;
  if (a.medals.bronze !== b.medals.bronze) return b.medals.bronze - a.medals.bronze;

  return nameA.localeCompare(nameB);
}

