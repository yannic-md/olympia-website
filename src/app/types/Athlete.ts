// used in forms
export interface AthleteForm {
  id?: number;
  name: string;
  countryCode: string;
  countryName: string;
  sport: string;
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
  medals: { gold: number; silver: number; bronze: number };
  bestTime: string | null;
}
