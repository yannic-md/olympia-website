import {Component, HostListener} from '@angular/core';
import {RouterLink, Routes} from "@angular/router";
import {NgOptimizedImage} from "@angular/common";
import {routes} from "../../app.routes";

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    NgOptimizedImage
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  protected readonly routes: Routes = [...routes].reverse();
  protected isLanguageMenuOpen: boolean = false;
  protected isMobileMenuOpen: boolean = false;
  protected currentLanguage: string = 'Deutsch';

  /**
   * Returns the display name for a given route path.
   *
   * @param path_url - The route path identifier
   * @returns The localized display name for the route
   */
  protected getRouteName(path_url: string | undefined): string {
    if (!path_url) { return ''; }
    if (path_url === 'detailed') { return 'Detaillierte Ergebnisse' } else { return 'Startseite'; }
  }

  /**
   * Toggles the language dropdown menu.
   */
  protected toggleLanguageMenu(): void {
    this.isLanguageMenuOpen = !this.isLanguageMenuOpen;
  }

  /**
   * Toggles the mobile navigation menu.
   */
  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Changes the current language and closes the dropdown.
   *
   * @param language - The language to switch to
   */
  protected changeLanguage(language: string): void {
    this.currentLanguage = language;
    this.isLanguageMenuOpen = false;
  }

  /**
   * Closes the language menu when clicking outside of it.
   *
   * @param event - The click event
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const languageMenu: HTMLDivElement | null = target.closest('.language-menu-container');
    const mobileMenu: HTMLDivElement | null = target.closest('.mobile-menu-container');

    if (!languageMenu && this.isLanguageMenuOpen) {
      this.isLanguageMenuOpen = false;
    }

    if (!mobileMenu && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }
}
