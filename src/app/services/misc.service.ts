import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MiscService {

  /**
   * Returns the display name for a given route path.
   *
   * @param path_url - The route path identifier
   * @returns The localized display name for the route
   */
  getRouteName(path_url: string | undefined): string {
    if (!path_url) { return ''; }
    if (path_url === 'detailed') { return 'Detaillierte Ergebnisse' } else { return 'Startseite'; }
  }

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

}
