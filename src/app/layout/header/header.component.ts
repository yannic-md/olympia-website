import {Component, HostListener, OnInit} from '@angular/core';
import {RouterLink, Routes} from "@angular/router";
import {NgClass, NgOptimizedImage} from "@angular/common";
import {routes} from "../../app.routes";
import {animate, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    NgOptimizedImage,
    NgClass,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit {
  protected readonly routes: Routes = [...routes].reverse();
  protected isLanguageMenuOpen: boolean = false;
  protected isMobileMenuOpen: boolean = false;
  protected currentLanguage: string = 'Deutsch';

  // header-scroll related
  protected showUpperPart: boolean = true;
  protected lastScrollPosition: number = 0;
  protected scrollThreshold: number = 50;
  protected isHoveringHeader: boolean = false;

  /**
   * Initializes the component and stores the current scroll position.
   * This is used as a baseline for detecting scroll direction changes.
   */
  public ngOnInit(): void {
    this.lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  }

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

  /**
   * Handles the window scroll event and toggles the visibility of the upper
   * header section based on scroll direction and a configured threshold.
   */
  @HostListener('window:scroll', [])
  protected onWindowScroll(): void {
    const currentScrollPosition: number = window.pageYOffset || document.documentElement.scrollTop;
    const isScrollingUp: boolean = currentScrollPosition < this.lastScrollPosition;

    // show "Upper part" if user scrolls up OR we moved more than scrollThreshold pixels
    if (isScrollingUp || currentScrollPosition <= this.scrollThreshold) {
      this.showUpperPart = true;
    } else if (currentScrollPosition > this.scrollThreshold) {
      this.showUpperPart = false;
    }

    this.lastScrollPosition = currentScrollPosition;
  }
}
