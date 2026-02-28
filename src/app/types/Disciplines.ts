/** winner for a single medal rank within a discipline. */
export interface DisciplineWinner {
  name: string;
  countryCode: string;
  countryName: string;
  result: string;
}

/** Aggregated discipline card data shown in the grid. */
export interface DisciplineCard {
  rawName: string;
  displayName: string;
  gold: DisciplineWinner | null;
  silver: DisciplineWinner | null;
  bronze: DisciplineWinner | null;
}

export interface DisciplineResult {
  gold:   DisciplineWinner;
  silver: DisciplineWinner;
  bronze: DisciplineWinner;
}

// Placeholder Data TODO: Replace with real api
export const DISCIPLINE_RESULTS: Record<string, DisciplineResult> = {
  'Alpine Skiing': {
    gold:   { name: 'Marco Odermatt',    countryCode: 'ch', countryName: 'Schweiz',    result: '1:45.23' },
    silver: { name: 'Henrik Kristoffersen', countryCode: 'no', countryName: 'Norwegen', result: '1:45.89' },
    bronze: { name: 'Alexis Pinturault', countryCode: 'fr', countryName: 'Frankreich', result: '1:46.01' },
  },
  'Biathlon': {
    gold:   { name: 'Johannes Bø',       countryCode: 'no', countryName: 'Norwegen',   result: '32:14.5' },
    silver: { name: 'Quentin Fillon Maillet', countryCode: 'fr', countryName: 'Frankreich', result: '32:45.1' },
    bronze: { name: 'Sturla Holm Lægreid', countryCode: 'no', countryName: 'Norwegen', result: '32:58.3' },
  },
  'Bobsleigh': {
    gold:   { name: 'Francesco Friedrich', countryCode: 'de', countryName: 'Deutschland', result: '3:47.12' },
    silver: { name: 'Johannes Lochner',  countryCode: 'de', countryName: 'Deutschland', result: '3:47.54' },
    bronze: { name: 'Christoph Hafer',   countryCode: 'de', countryName: 'Deutschland', result: '3:48.02' },
  },
  'Cross-Country Skiing': {
    gold:   { name: 'Johannes Kläbo',    countryCode: 'no', countryName: 'Norwegen',   result: '1:10:23' },
    silver: { name: 'Harald Østberg Amundsen', countryCode: 'no', countryName: 'Norwegen', result: '1:10:45' },
    bronze: { name: 'Federico Pellegrino', countryCode: 'it', countryName: 'Italien',  result: '1:11:02' },
  },
  'Curling': {
    gold:   { name: 'Niklas Edin',       countryCode: 'se', countryName: 'Schweden',   result: '8 Punkte' },
    silver: { name: 'Brad Gushue',       countryCode: 'ca', countryName: 'Kanada',     result: '7 Punkte' },
    bronze: { name: 'Bruce Mouat',       countryCode: 'gb', countryName: 'Großbritannien', result: '6 Punkte' },
  },
  'Figure Skating': {
    gold:   { name: 'Nathan Chen',       countryCode: 'us', countryName: 'USA',        result: '332.60 Pkt' },
    silver: { name: 'Yuzuru Hanyu',      countryCode: 'jp', countryName: 'Japan',      result: '319.84 Pkt' },
    bronze: { name: 'Vincent Zhou',      countryCode: 'us', countryName: 'USA',        result: '306.54 Pkt' },
  },
  'Freestyle Skiing': {
    gold:   { name: 'Eileen Gu',         countryCode: 'cn', countryName: 'China',      result: '188.25 Pkt' },
    silver: { name: 'Mathilde Gremaud', countryCode: 'ch', countryName: 'Schweiz',    result: '183.75 Pkt' },
    bronze: { name: 'Tess Ledeux',       countryCode: 'fr', countryName: 'Frankreich', result: '180.40 Pkt' },
  },
  'Ice Hockey': {
    gold:   { name: 'Team Finnland',     countryCode: 'fi', countryName: 'Finnland',   result: '2:1 (n.V.)' },
    silver: { name: 'Team ROC',          countryCode: 'ru', countryName: 'Russland',   result: '2:1 (n.V.)' },
    bronze: { name: 'Team Slowakei',     countryCode: 'sk', countryName: 'Slowakei',   result: '4:0' },
  },
  'Luge': {
    gold:   { name: 'Johannes Ludwig',   countryCode: 'de', countryName: 'Deutschland', result: '3:08.545' },
    silver: { name: 'Wolfgang Kindl',    countryCode: 'at', countryName: 'Österreich', result: '3:08.707' },
    bronze: { name: 'Reinhard Egger',    countryCode: 'at', countryName: 'Österreich', result: '3:08.760' },
  },
  'Nordic Combined': {
    gold:   { name: 'Jens Luraas Oftebro', countryCode: 'no', countryName: 'Norwegen', result: '25:46.0' },
    silver: { name: 'Joergen Graabak',   countryCode: 'no', countryName: 'Norwegen',   result: '25:46.0' },
    bronze: { name: 'Johannes Rydzek',   countryCode: 'de', countryName: 'Deutschland', result: '25:52.3' },
  },
  'Short Track Speed Skating': {
    gold:   { name: 'Ren Ziwei',         countryCode: 'cn', countryName: 'China',      result: '1:26.768' },
    silver: { name: 'Li Wenlong',        countryCode: 'cn', countryName: 'China',      result: '+0.060' },
    bronze: { name: 'Hwang Dae-heon',    countryCode: 'kr', countryName: 'Südkorea',   result: '+0.195' },
  },
  'Skeleton': {
    gold:   { name: 'Christopher Grotheer', countryCode: 'de', countryName: 'Deutschland', result: '4:01.01' },
    silver: { name: 'Axel Jungk',        countryCode: 'de', countryName: 'Deutschland', result: '4:01.45' },
    bronze: { name: 'Tomass Dukurs',     countryCode: 'lv', countryName: 'Lettland',   result: '4:01.60' },
  },
  'Ski Jumping': {
    gold:   { name: 'Ryoyu Kobayashi',   countryCode: 'jp', countryName: 'Japan',      result: '297.0 Pkt' },
    silver: { name: 'Karl Geiger',       countryCode: 'de', countryName: 'Deutschland', result: '293.7 Pkt' },
    bronze: { name: 'Piotr Żyła',        countryCode: 'pl', countryName: 'Polen',       result: '292.0 Pkt' },
  },
  'Snowboard': {
    gold:   { name: 'Shaun White',       countryCode: 'us', countryName: 'USA',        result: '97.75 Pkt' },
    silver: { name: 'Ayumu Hirano',      countryCode: 'jp', countryName: 'Japan',      result: '95.00 Pkt' },
    bronze: { name: 'Scotty James',      countryCode: 'au', countryName: 'Australien', result: '92.50 Pkt' },
  },
  'Speed Skating': {
    gold:   { name: 'Nils van der Poel', countryCode: 'se', countryName: 'Schweden',   result: '12:30.74' },
    silver: { name: 'Patrick Roest',     countryCode: 'nl', countryName: 'Niederlande', result: '12:31.12' },
    bronze: { name: 'Ruslan Murashov',   countryCode: 'ru', countryName: 'Russland',   result: '12:31.56' },
  },
};
