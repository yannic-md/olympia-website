import { sortByMedals } from './medal-sort.util';

describe('sortByMedals', () => {
  const mockObjA = { medals: { gold: 5, silver: 3, bronze: 2 } };
  const mockObjB = { medals: { gold: 4, silver: 4, bronze: 3 } };

  it('should sort by filtered medal when filterMedal is not "all"', () => {
    const objA = { medals: { gold: 2, silver: 5, bronze: 1 } };
    const objB = { medals: { gold: 3, silver: 3, bronze: 2 } };

    const result = sortByMedals(objA, objB, 'A', 'B', 'silver');

    expect(result).toBeLessThan(0);
  });

  it('should continue to next comparison when filtered medal counts are equal', () => {
    const objA = { medals: { gold: 1, silver: 5, bronze: 2 } };
    const objB = { medals: { gold: 3, silver: 5, bronze: 1 } };

    const result = sortByMedals(objA, objB, 'A', 'B', 'silver');

    expect(result).toBeGreaterThan(0);
  });

  it('should sort by gold medals when filterMedal is "all"', () => {
    const result = sortByMedals(mockObjA, mockObjB, 'A', 'B', 'all');

    expect(result).toBeLessThan(0);
  });

  it('should sort by silver medals when gold is equal', () => {
    const objA = { medals: { gold: 5, silver: 3, bronze: 2 } };
    const objB = { medals: { gold: 5, silver: 4, bronze: 1 } };

    const result = sortByMedals(objA, objB, 'A', 'B', 'all');

    expect(result).toBeGreaterThan(0);
  });

  it('should sort by bronze medals when gold and silver are equal', () => {
    const objA = { medals: { gold: 5, silver: 3, bronze: 2 } };
    const objB = { medals: { gold: 5, silver: 3, bronze: 4 } };

    const result = sortByMedals(objA, objB, 'A', 'B', 'all');

    expect(result).toBeGreaterThan(0);
  });

  it('should sort alphabetically by name when all medals are equal', () => {
    const objA = { medals: { gold: 5, silver: 3, bronze: 2 } };
    const objB = { medals: { gold: 5, silver: 3, bronze: 2 } };

    const resultAB = sortByMedals(objA, objB, 'Zebra', 'Alpha', 'all');
    const resultBA = sortByMedals(objA, objB, 'Alpha', 'Beta', 'all');

    expect(resultAB).toBeGreaterThan(0);
    expect(resultBA).toBeLessThan(0);
  });

  it('should return 0 when all medals and names are equal', () => {
    const objA = { medals: { gold: 5, silver: 3, bronze: 2 } };
    const objB = { medals: { gold: 5, silver: 3, bronze: 2 } };

    const result = sortByMedals(objA, objB, 'Same', 'Same', 'all');

    expect(result).toBe(0);
  });

  it('should prioritize filtered medal over other medals', () => {
    const objA = { medals: { gold: 10, silver: 1, bronze: 0 } };
    const objB = { medals: { gold: 1, silver: 5, bronze: 0 } };

    const result = sortByMedals(objA, objB, 'A', 'B', 'silver');

    expect(result).toBeGreaterThan(0);
  });
});

