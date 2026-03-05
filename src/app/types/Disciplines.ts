import {ScoreType} from "./Athlete";

export type MedalType = 'gold' | 'silver' | 'bronze';

// object which is returned in the user athlete api response
export interface V2SportResult {
  sportId: number;
  sportName: string;
  sportRawName: string;
  scoreType: ScoreType | null;
  result: string | null;
  rank: number | null;
  medal: 'GOLD' | 'SILVER' | 'BRONZE' | null;
}

// represents a discipline type
export interface V2Sport {
  id: number;
  rawName: string;
  name: string;
  scoreType: ScoreType;
  participants: DisciplineParticipant[];
}

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

/** Form model for a new or updated discipline result entry. */
export interface DisciplineResultForm {
  athleteId: number;
  athleteName: string;
  sportRawName: string;
  medal: MedalType;
  /** The result value (time, points or wins) as a raw string. */
  resultValue: string;
}

// participant of a discipline
export interface DisciplineParticipant {
  athleteId: number;
  firstName: string;
  lastName: string;
  countryId: number | null;
  countryCode: string | null;
  countryName: string | null;
  medal: 'GOLD' | 'SILVER' | 'BRONZE' | null;
  result: string | null;
  rank: number | null;
}
