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
    { label: 'BREADCRUMB.NAVIGATION.START', path: '/' },
    { label: 'BREADCRUMB.NAVIGATION.DETAILED', path: '/detailed' },
    { label: 'BREADCRUMB.NAVIGATION.LEARNMORE', externalUrl: 'https://www.olympics.com/de/olympic-games/paris-2024' }
  ];

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
