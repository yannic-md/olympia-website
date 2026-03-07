import {Component, HostListener, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {isPlatformBrowser, NgClass, NgOptimizedImage} from "@angular/common";
import {animate, style, transition, trigger} from "@angular/animations";
import {MiscService} from "../../../services/misc/misc.service";
import {AuthService} from "../../../services/api/auth/auth.service";
import {AlertService} from "../../../services/api/alert/alert.service";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    NgOptimizedImage,
    NgClass,
    RouterLinkActive,
    TranslatePipe,
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
  protected isLanguageMenuOpen: boolean = false;
  protected isMobileMenuOpen: boolean = false;
  protected currentLanguage: string = 'Deutsch';

  // header-scroll related
  protected showUpperPart: boolean = true;
  protected lastScrollPosition: number = 0;
  protected scrollThreshold: number = 50;
  protected isHoveringHeader: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, protected miscService: MiscService,
              protected authService: AuthService, private alertService: AlertService, private router: Router,
              private translateService: TranslateService) {
    if (isPlatformBrowser(this.platformId) && localStorage.getItem('lang') != null) {
      this.currentLanguage = localStorage.getItem('lang') as string;
    }
  }

  /**
   * Initializes the component and stores the current scroll position.
   * This is used as a baseline for detecting scroll direction changes.
   */
  public ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    }

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

    switch (language) {
      case 'French':
        this.translateService.use('fr');
        break;
      case 'English':
        this.translateService.use('en');
        break;
      default: // german
        this.translateService.use('de');
        break;
    }

    localStorage.setItem('lang', this.currentLanguage);
    this.isLanguageMenuOpen = false;
  }

  /**
   * Log out the currently logged in user by invalidating the session cookie on the backend.
   */
  protected logout(): void {
    if (!this.authService.isLoggedIn()) { this.router.navigate(["/login"]).then(); return; }

    this.authService.logout().subscribe({
      next: () => {
        this.alertService.success(this.translateService.instant('ALERT.LOGOUT'));
        this.router.navigate(["/login"]).then();
      },
      error: () => {
        // Even if the backend call fails, clear local state
        this.authService.currentUser.set(null);
        this.router.navigate(["/login"]).then();
      }
    });
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
