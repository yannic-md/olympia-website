import {V2Sport} from "./Disciplines";
import {V2Athlete} from "./Athlete";
import {V2Country} from "./Country";

export const API_URL: string = 'http://localhost:8080/api';

// the saved user object to check if it is logged in
export interface AuthUser {
  id: number;
  username: string;
  role: string;
  password: string;
}

// Raw API response after a succesful login
export interface LoginResponse {
  id: number;
  username: string;
  role: string;
  message: string;
}

// Raw API data to get the entire leaderboard
export interface LeaderboardResponse {
  sports: V2Sport[];
  athletes: V2Athlete[];
  countries: V2Country[];
}

// used to display the amount of specific medals
export interface MedalSummary {
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}
