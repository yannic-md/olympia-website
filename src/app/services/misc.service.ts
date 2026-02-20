import {Injectable, WritableSignal} from '@angular/core';

interface NavigationItem {
  label: string;
  path?: string;
  externalUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MiscService {
  nav_items: NavigationItem[] = [
    { label: 'Übersicht', path: '/' },
    { label: 'Detaillierte Ergebnisse', path: '/detailed' },
    { label: 'Mehr über die Spiele erfahren', externalUrl: 'https://www.olympics.com/de/olympic-games/paris-2024' }
  ];

  /**
   * Returns the TailwindCSS background color class for a given medal type.
   *
   * @param type Medal type to map to a color class.
   * @returns TailwindCSS background color class for the specified medal type.
   */
  getWinnerColor(type: string): string {
    switch (type) {
      case 'Gold':
        return 'bg-[#FCD34D]';
      case 'Silber':
        return 'bg-[#E5E7EB]';
    }

    return 'bg-[#D6A472]'; // bronze
  }

  /**
   * Checks if the given sport is a race sport that tracks time-based results.
   *
   * @param {string} sportName - The name of the sport to check.
   * @returns {boolean} True if the sport is a race sport with time tracking, false otherwise.
   */
  isRaceSport(sportName: string): boolean {
    const raceSports: string[] = ['Bobsport', 'Biathlon', 'Ski Alpin', 'Eisschnelllauf', 'Ski Langlauf', 'Shorttrack',
                                  'Rennrodeln', 'Skeleton'];
    return raceSports.includes(sportName);
  }

  /**
   * Handles backdrop clicks to close the modal when clicking outside the modal content.
   */
  onBackdropClick(event: MouseEvent, close: () => void): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  /**
   * Updates a specific field in a signal-based form data object.
   */
  updateField<T, K extends keyof T>(formSignal: WritableSignal<T>, field: K, value: T[K]): void {
    formSignal.update(current => ({ ...current, [field]: value }));
  }

}
