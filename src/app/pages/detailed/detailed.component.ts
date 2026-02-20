import {Component, computed, Signal, signal, WritableSignal} from '@angular/core';
import {HeaderComponent} from "../../layout/sections/header/header.component";
import {BreadcrumbComponent} from "../../layout/sections/breadcrumb/breadcrumb.component";
import {FormsModule} from "@angular/forms";
import {FooterComponent} from "../../layout/sections/footer/footer.component";
import {NgOptimizedImage} from "@angular/common";
import {FilterSelectComponent} from "../../layout/elements/filter-select/filter-select.component";
import {TableCountryBadgeComponent} from "../../layout/elements/table-country-badge/table-country-badge.component";
import {TableMedalPillsComponent} from "../../layout/elements/table-medal-pills/table-medal-pills.component";
import {TableActionsComponent} from "../../layout/elements/table-actions/table-actions.component";
import {ModalAthleteComponent} from "../../layout/sections/modal/modal-athlete/modal-athlete.component";
import {MiscService} from "../../services/misc.service";
import {AlertBoxComponent} from "../../layout/sections/alert-box/alert-box.component";
import {ModalCountryComponent} from "../../layout/sections/modal/modal-country/modal-country.component";
import {CountryForm, CountryStats} from "../../types/Country";
import {Athlete, AthleteForm} from "../../types/Athlete";

@Component({
  selector: 'app-detailed',
  imports: [
    HeaderComponent,
    BreadcrumbComponent,
    FormsModule,
    FooterComponent,
    FilterSelectComponent,
    NgOptimizedImage,
    TableCountryBadgeComponent,
    TableMedalPillsComponent,
    TableActionsComponent,
    ModalAthleteComponent,
    AlertBoxComponent,
    ModalCountryComponent
  ],
  templateUrl: './detailed.component.html',
  styleUrl: './detailed.component.css',
})
export class DetailedComponent {
  protected selectedView: WritableSignal<'athletes' | 'countries'> = signal<'athletes' | 'countries'>('athletes');
  protected filterCountry: WritableSignal<string> = signal<string>('all');
  protected filterSport: WritableSignal<string> = signal<string>('all');
  protected filterMedal: WritableSignal<'all' | 'gold' | 'silver' | 'bronze'> = signal<'all' | 'gold' | 'silver' | 'bronze'>('all');
  protected searchQuery: WritableSignal<string> = signal<string>('');

  protected editingAthlete: WritableSignal<Athlete | null> = signal(null);
  protected editingCountry: WritableSignal<CountryStats | null> = signal(null);
  protected isAthleteModalOpen: WritableSignal<boolean> = signal(false);
  protected isCountryModalOpen: WritableSignal<boolean> = signal(false);
  protected showSuccessAlert: WritableSignal<boolean> = signal(false);
  protected successMessage: WritableSignal<string> = signal('');

  // TODO: Get from backend
  protected athletes: WritableSignal<Athlete[]> = signal<Athlete[]>([
    { id: 1, name: 'Max Mustermann', countryCode: 'AT', countryName: 'Österreich', sport: 'Bobsport',
      medals: { gold: 1, silver: 1, bronze: 2 }, bestTime: '3:24.56' },
    { id: 2, name: 'Maria Müller', countryCode: 'CH', countryName: 'Schweiz', sport: 'Curling',
      medals: { gold: 1, silver: 1, bronze: 2 }, bestTime: null },
    { id: 3, name: 'Lars Nordström', countryCode: 'NO', countryName: 'Norwegen', sport: 'Biathlon',
      medals: { gold: 2, silver: 0, bronze: 1 }, bestTime: '24:15.8' },
    { id: 4, name: 'Sophie Schmidt', countryCode: 'DE', countryName: 'Deutschland', sport: 'Ski Alpin',
      medals: { gold: 1, silver: 2, bronze: 0 }, bestTime: '1:45.23' },
    { id: 5, name: 'John Anderson', countryCode: 'US', countryName: 'USA', sport: 'Eisschnelllauf',
      medals: { gold: 0, silver: 1, bronze: 1 }, bestTime: '1:07.95' },
    { id: 6, name: 'Anna Kowalska', countryCode: 'PL', countryName: 'Polen', sport: 'Skispringen',
      medals: { gold: 1, silver: 0, bronze: 1 }, bestTime: null },
    { id: 7, name: 'Yuki Tanaka', countryCode: 'JP', countryName: 'Japan', sport: 'Eiskunstlauf',
      medals: { gold: 2, silver: 1, bronze: 0 }, bestTime: null },
    { id: 8, name: 'Pierre Dubois', countryCode: 'FR', countryName: 'Frankreich', sport: 'Freestyle-Skiing',
      medals: { gold: 0, silver: 2, bronze: 1 }, bestTime: null },
    { id: 9, name: 'Emma Johansson', countryCode: 'SE', countryName: 'Schweden', sport: 'Ski Langlauf',
      medals: { gold: 3, silver: 1, bronze: 1 }, bestTime: '38:42.5' },
    { id: 10, name: 'Mikhail Petrov', countryCode: 'RU', countryName: 'Russland', sport: 'Eishockey',
      medals: { gold: 1, silver: 0, bronze: 0 }, bestTime: null },
    { id: 11, name: 'Isabella Rossi', countryCode: 'IT', countryName: 'Italien', sport: 'Shorttrack',
      medals: { gold: 0, silver: 1, bronze: 2 }, bestTime: '42.893' },
    { id: 12, name: 'Kim Min-ji', countryCode: 'KR', countryName: 'Südkorea', sport: 'Snowboard',
      medals: { gold: 2, silver: 0, bronze: 1 }, bestTime: null },
    { id: 13, name: 'Hans Bergmann', countryCode: 'DE', countryName: 'Deutschland', sport: 'Rennrodeln',
      medals: { gold: 1, silver: 1, bronze: 0 }, bestTime: '3:15.782' },
    { id: 14, name: 'Emily Clark', countryCode: 'CA', countryName: 'Kanada', sport: 'Skeleton',
      medals: { gold: 0, silver: 0, bronze: 2 }, bestTime: '3:42.91' },
    { id: 15, name: 'Viktor Novak', countryCode: 'CZ', countryName: 'Tschechien', sport: 'Eishockey',
      medals: { gold: 0, silver: 1, bronze: 1 }, bestTime: null },
    { id: 16, name: 'Olga Ivanova', countryCode: 'RU', countryName: 'Russland', sport: 'Biathlon',
      medals: { gold: 1, silver: 2, bronze: 1 }, bestTime: '28:34.2' },
    { id: 17, name: 'Thomas Hansen', countryCode: 'DK', countryName: 'Dänemark', sport: 'Curling',
      medals: { gold: 0, silver: 1, bronze: 0 }, bestTime: null },
    { id: 18, name: 'Sarah Williams', countryCode: 'GB', countryName: 'Großbritannien', sport: 'Skeleton',
      medals: { gold: 1, silver: 0, bronze: 0 }, bestTime: '3:38.45' },
    { id: 19, name: 'Chen Wei', countryCode: 'CN', countryName: 'China', sport: 'Shorttrack',
      medals: { gold: 2, silver: 1, bronze: 0 }, bestTime: '41.236' },
    { id: 20, name: 'Isabella van der Berg', countryCode: 'NL', countryName: 'Niederlande', sport: 'Eisschnelllauf',
      medals: { gold: 3, silver: 2, bronze: 1 }, bestTime: '1:12.58' }]);

  // TODO: Get from Backend
  protected countriesData: WritableSignal<CountryStats[]> = signal<CountryStats[]>([]);
  protected countries: Signal<string[]> = computed((): string[] => this.countriesData().map(c => c.countryName).sort());
  protected sports: WritableSignal<string[]> = signal<string[]>(Array.from(new Set(this.athletes().map(a => a.sport))).sort());

  constructor(protected miscService: MiscService) { this.initializeCountriesFromAthletes(); }

  /**
   * Computed signal that transforms the currently selected athlete into an `AthleteForm` model.
   *
   * This ensures that the edit form always receives a consistent and type-safe data structure
   * whenever `editingAthlete` changes.
   */
  protected athleteEditData: Signal<any> = computed((): AthleteForm | null => {
    const athlete: Athlete | null = this.editingAthlete();
    if (!athlete) return null;

    return { id: athlete.id, name: athlete.name, countryCode: athlete.countryCode, countryName: athlete.countryName,
             sport: athlete.sport, goldMedals: athlete.medals.gold, silverMedals: athlete.medals.silver,
             bronzeMedals: athlete.medals.bronze, bestTime: athlete.bestTime || '' };
  });

  /**
   * Computed signal that transforms the currently selected country into an `CountryForm` model.
   *
   * This ensures that the edit form always receives a consistent and type-safe data structure
   * whenever `editingCountry` changes.
   */
  protected countryEditData: Signal<any> = computed((): CountryForm | null => {
    const country: CountryStats | null = this.editingCountry();
    if (!country) return null;

    return { countryCode: country.countryCode, countryName: country.countryName, goldMedals: country.medals.gold,
             silverMedals: country.medals.silver, bronzeMedals: country.medals.bronze };
  });

  /**
   * Deletes an athlete from the list by their ID.
   *
   * @param {number} athleteId - The unique ID of the athlete to delete.
   */
  protected onDeleteAthlete(athleteId: number): void {
    const athlete: Athlete | undefined = this.athletes().find(a => a.id === athleteId);
    if (!athlete) return;

    this.athletes.update(current => current.filter(a => a.id !== athleteId));
    this.successMessage.set(`Athlet "${athlete.name}" wurde erfolgreich gelöscht.`);
    this.showSuccessAlert.set(true);
  }

  /**
   * Opens the modal to edit an athlete from the list by their object.
   *
   * @param {Athlete} athlete - The object of the athlete.
   */
  protected onEditAthlete(athlete: Athlete): void {
    this.editingAthlete.set(athlete);
    this.isAthleteModalOpen.set(true);
  }

  /**
   * Updates an existing athlete in the list with the provided form data.
   *
   * Finds the athlete by ID and replaces its properties with the new values from the form.
   * Closes the edit modal and displays a success alert after updating.
   * Ensures the country code is stored in uppercase and best time is set to null if empty.
   *
   * @param {AthleteForm} form - The form data containing updated athlete information.
   */
  protected onUpdateAthlete(form: AthleteForm): void {
    this.athletes.update(current =>
      current.map(a => a.id === form.id ? { ...a, name: form.name, countryCode: form.countryCode.toUpperCase(),
                                                    countryName: form.countryName, sport: form.sport,
                                                    bestTime: form.bestTime || null, medals: { gold: form.goldMedals,
                                                    silver: form.silverMedals, bronze: form.bronzeMedals }} : a)
    );

    this.editingAthlete.set(null);
    this.isAthleteModalOpen.set(false);
    this.successMessage.set(`Athlet "${form.name}" wurde erfolgreich aktualisiert.`);
    this.showSuccessAlert.set(true);
  }

  /**
   * Deletes a country from the statistics list by its country code.
   *
   * Finds the country in the current statistics, removes it if present, and displays a success alert.
   * This method ensures that only existing countries are deleted and provides user feedback.
   *
   * @param {string} countryCode - The ISO code of the country to delete.
   */
  protected onDeleteCountry(countryCode: string): void {
    const country: CountryStats | undefined = this.countriesData().find(c => c.countryCode === countryCode);
    if (!country) return;

    this.countriesData.update(current => current.filter(c => c.countryCode !== countryCode));
    this.successMessage.set(`Das Land "${country.countryName}" wurde erfolgreich gelöscht.`);
    this.showSuccessAlert.set(true);
  }

  /**
   * Opens the modal to edit an country from the list by their object.
   *
   * @param {CountryStats} country - The object of the country.
   */
  protected onEditCountry(country: CountryStats): void {
    this.editingCountry.set(country);
    this.isCountryModalOpen.set(true);
  }

  /**
   * Updates an existing country in the list with the provided form data.
   *
   * Finds the country by CountryCode and replaces its properties with the new values from the form.
   * Closes the edit modal and displays a success alert after updating.
   * Ensures the country code is stored in uppercase and best time is set to null if empty.
   *
   * @param {CountryForm} form - The form data containing updated country information.
   */
  protected onUpdateCountry(form: CountryForm): void {
    this.countriesData.update(current =>
      current.map(c => c.countryCode === form.countryCode ? { ...c, countryName: form.countryName,
                                                                           medals: { gold: form.goldMedals,
                                                                                     silver: form.silverMedals,
                                                                                     bronze: form.bronzeMedals}} : c)
    );

    this.editingCountry.set(null);
    this.isCountryModalOpen.set(false);
    this.successMessage.set(`Das Land "${form.countryName}" wurde erfolgreich aktualisiert.`);
    this.showSuccessAlert.set(true);
  }

  /**
   * Computes and returns a filtered and sorted list of athletes based on current filter and search criteria.
   *
   * This computed signal evaluates the list of athletes by applying search text, country, and sport filters.
   * The resulting list is then sorted, prioritizing the selected medal type if specified, followed by gold, silver,
   * and bronze medal counts, and finally alphabetically by name.
   *
   * @returns {Signal<Athlete[]>} A signal containing the filtered and sorted array of athletes.
   */
  protected filteredAthletes: Signal<Athlete[]> = computed((): Athlete[] => {
    const filtered: Athlete[] = this.athletes().filter((athlete: Athlete): boolean => {
      const matchesSearchText: boolean = athlete.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        athlete.countryName.toLowerCase().includes(this.searchQuery().toLowerCase());

      const matchesCountryFilter: boolean = this.filterCountry() === 'all' ||
        athlete.countryName === this.filterCountry();

      const matchesSportsFilter: boolean = this.filterSport() === 'all' || athlete.sport === this.filterSport();
      return matchesSearchText && matchesCountryFilter && matchesSportsFilter;
    });

    // list is sorted by medal amount & alphabet
    return filtered.sort((a, b): number => this.sortByMedals(a, b, a.name, b.name));
  });

  /**
   * Computes and returns filtered country list based on filtered athletes.
   *
   * This computed signal processes the filtered athlete list and aggregates medal counts per country.
   * It creates a map of countries with their respective total gold, silver, and bronze medals earned by all athletes
   * from that country. The resulting list is sorted by medal counts (prioritizing the selected medal filter) and
   * alphabetically by country name.
   *
   * @deprecated probaly not needed anymore if we get the real api data. TODO
   * @returns {Signal<CountryStats[]>} A signal containing the aggregated and sorted array of country statistics.
   */
  protected filteredCountries: Signal<CountryStats[]> = computed((): CountryStats[] => {
    return this.countriesData()
      .filter(country => {
        const matchesSearch = country.countryName.toLowerCase()
          .includes(this.searchQuery().toLowerCase());

        const matchesCountryFilter = this.filterCountry() === 'all' ||
          country.countryName === this.filterCountry();

        return matchesSearch && matchesCountryFilter;
      }).sort((a, b): number => this.sortByMedals(a, b, a.countryName, b.countryName));
  });

  /**
   * Initializes the countries data by aggregating medal counts from all athletes.
   *
   * This method creates a map of countries based on the current athletes list, calculates the total
   * number of gold, silver, and bronze medals per country, and updates the countriesData signal
   * with the aggregated results.
   */
  private initializeCountriesFromAthletes(): void {
    const countryMap = new Map<string, CountryStats>();

    this.athletes().forEach(athlete => {
      if (!countryMap.has(athlete.countryCode)) {
        countryMap.set(athlete.countryCode, { countryCode: athlete.countryCode, countryName: athlete.countryName,
                                              medals: { gold: 0, silver: 0, bronze: 0 } });
      }

      const stat = countryMap.get(athlete.countryCode)!;
      stat.medals.gold += athlete.medals.gold;
      stat.medals.silver += athlete.medals.silver;
      stat.medals.bronze += athlete.medals.bronze;
    });

    this.countriesData.set(Array.from(countryMap.values()));
  }

  /**
   * Sorts two objects by their medal counts, prioritizing a specific medal type if filtered, then by total medals,
   * and finally alphabetically by name.
   *
   * This method first checks if a specific medal type filter is active. If so, it sorts by that medal type in descending order.
   * Otherwise, it sorts by gold, silver, and bronze medals in that priority order (descending).
   * If all medal counts are equal, it falls back to alphabetical comparison of the provided names.
   *
   * @param {object} a - First object containing medal counts (gold, silver, bronze).
   * @param {object} b - Second object containing medal counts (gold, silver, bronze).
   * @param {string} nameA - Name of the first object for alphabetical fallback sorting.
   * @param {string} nameB - Name of the second object for alphabetical fallback sorting.
   * @returns {number} Negative if a should come first, positive if b should come first, zero if equal.
   */
  private sortByMedals(a: { medals: { gold: number; silver: number; bronze: number } },
                       b: { medals: { gold: number; silver: number; bronze: number } }, nameA: string, nameB: string): number {
    if (this.filterMedal() !== 'all') {
      const medalType: 'gold' | 'silver' | 'bronze' = this.filterMedal() as 'gold' | 'silver' | 'bronze';
      const medalComparison: number = b.medals[medalType] - a.medals[medalType];
      if (medalComparison !== 0) return medalComparison;
    }

    if (a.medals.gold !== b.medals.gold) return b.medals.gold - a.medals.gold;
    if (a.medals.silver !== b.medals.silver) return b.medals.silver - a.medals.silver;
    if (a.medals.bronze !== b.medals.bronze) return b.medals.bronze - a.medals.bronze;

    return nameA.localeCompare(nameB);
  }

  /**
   * Handles the creation and addition of a new athlete to the list.
   *
   * Creates a new athlete object from the provided form data with an auto-incremented ID,
   * adds it to the athletes list, closes the modal dialog, and displays a success alert.
   * TODO: Implement API call
   *
   * @param {Object} form - The form data containing athlete information.
   * @param {string} form.name - The full name of the athlete.
   * @param {string} form.countryCode - The ISO country code (will be converted to uppercase).
   * @param {string} form.countryName - The full country name.
   * @param {string} form.sport - The sport discipline.
   * @param {number} form.goldMedals - Number of gold medals won.
   * @param {number} form.silverMedals - Number of silver medals won.
   * @param {number} form.bronzeMedals - Number of bronze medals won.
   * @param {string} form.bestTime - Best time achieved (optional, will be null if empty).
   */
  protected onAddAthlete(form: { name: string; countryCode: string; countryName: string; sport: string;
                                 goldMedals: number; silverMedals: number; bronzeMedals: number; bestTime: string }): void {
    const newAthlete: Athlete = { id: Math.max(...this.athletes().map(a => a.id), 0) + 1,
                                  name: form.name, countryCode: form.countryCode.toUpperCase(),
                                  countryName: form.countryName, sport: form.sport, bestTime: form.bestTime || null,
                                  medals: { gold: form.goldMedals, silver: form.silverMedals,  bronze: form.bronzeMedals }};

    this.athletes.update(current => [...current, newAthlete]);
    this.isAthleteModalOpen.set(false);

    this.successMessage.set(`Athlet "${form.name}" wurde erfolgreich hinzugefügt.`);
    this.showSuccessAlert.set(true);
  }

  /**
   * Handles the creation and addition of a new country to the statistics list.
   *
   * Creates a new country statistics entry from the provided form data if the country does not already exist.
   * The country code is converted to uppercase before checking for duplicates. After processing, the modal
   * is closed and a success alert is displayed.
   * TODO: Implement API call
   *
   * @param {Object} form - The form data containing country information.
   * @param {string} form.countryCode - The ISO country code (will be converted to uppercase).
   * @param {string} form.countryName - The full country name.
   * @param {number} form.goldMedals - Number of gold medals for the country.
   * @param {number} form.silverMedals - Number of silver medals for the country.
   * @param {number} form.bronzeMedals - Number of bronze medals for the country.
   */
  protected onAddCountry(form: { countryCode: string; countryName: string;
                                 goldMedals: number; silverMedals: number; bronzeMedals: number;}): void {
    const countryExists: boolean = this.countriesData().some(c => c.countryCode === form.countryCode);
    if (!countryExists) {
      const newCountry: CountryStats = { countryCode: form.countryCode.toUpperCase(), countryName: form.countryName,
                                         medals: { gold: form.goldMedals,  silver: form.silverMedals,  bronze: form.bronzeMedals }
      };

      this.countriesData.update(current => [...current, newCountry]);
    }

    this.isCountryModalOpen.set(false);
    this.successMessage.set(`Land "${form.countryName}" wurde erfolgreich hinzugefügt.`);
    this.showSuccessAlert.set(true);
  }

}
