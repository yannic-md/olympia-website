// used in the country CRUD modal
import {V2AthleteRef} from "./Athlete";
import {MedalSummary} from "./API";

// used for CRUD operations
export interface CountryForm {
  countryCode: string;
  countryName: string;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  translate: boolean; /** When true, countryName represents the English name; nameDe & nameFr are additional. */
  nameDe?: string;
  nameFr?: string;
}

// used for CRUD operations (new)
export interface FormCountryPayload {
  code: string;
  name: string;
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
}

// used to show all countries in a table
export interface CountryStats {
  countryId: number;
  countryCode: string;
  countryName: string;
  medals: { gold: number; silver: number; bronze: number };
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
}

// raw api data representing a country
export interface V2Country {
  id: number;
  code: string;
  name: string;
  medals: MedalSummary;
  leaderboardRank: number;
  athletes: V2AthleteRef[];
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
}

// object that represents a country inside of an athlete
export interface V2CountryRef {
  id: number;
  code: string;
  name: string;
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
}
