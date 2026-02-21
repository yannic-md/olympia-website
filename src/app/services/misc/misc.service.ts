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
