// used in the country CRUD modal
export interface CountryForm {
  countryCode: string;
  countryName: string;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
}

// used to show all countries in a table
export interface CountryStats {
  countryCode: string;
  countryName: string;
  medals: { gold: number; silver: number; bronze: number };
}
