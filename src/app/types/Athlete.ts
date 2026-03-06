import {MedalSummary} from "./API";
import {V2CountryRef} from "./Country";
import {V2SportResult} from "./Disciplines";

export type ScoreType = 'TIME' | 'PTS' | 'WINS';

// used in forms
export interface AthleteForm {
  id?: number;
  name: string;
  countryCode: string;
  countryName: string;
  sport: string;
  sportRawName: string;
  scoreType: ScoreType | null;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  bestTime: string;
}

// used to show statistics about the athlete (inside a table)
export interface Athlete {
  id: number;
  name: string;
  countryId: number;
  countryCode: string;
  countryName: string;
  sport: string;
  sportRawName: string;
  scoreType: ScoreType | null;
  medals: { gold: number; silver: number; bronze: number };
  bestTime: string | null;
}

// used for CRUD operations (new)
export interface AthletePayload {
  firstName: string;
  lastName: string;
  countryId: number;
}

// Sorted list of sport results with translated names.
export interface AthleteResult {
  sport: string;
  medal: 'gold' | 'silver' | 'bronze';
  result: string;
}

// athlete object for sublist items of a country
export interface V2AthleteRef {
  id: number;
  firstName: string;
  lastName: string;
  medals: MedalSummary;
}

// raw api data to get the athlete object
export interface V2Athlete {
  id: number;
  firstName: string;
  lastName: string;
  country: V2CountryRef | null;
  medals: MedalSummary;
  leaderboardRank: number;
  results: V2SportResult[];
}
