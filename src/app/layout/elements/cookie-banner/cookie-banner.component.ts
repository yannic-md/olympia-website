import {Component, Inject, PLATFORM_ID, signal, WritableSignal} from '@angular/core';
import {TranslatePipe} from "@ngx-translate/core";
import {isPlatformBrowser} from "@angular/common";

@Component({
  selector: 'app-cookie-banner',
  imports: [
    TranslatePipe
  ],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.css',
})
export class CookieBannerComponent {
  protected isVisible: WritableSignal<boolean> = signal(false);
  protected isLeaving: WritableSignal<boolean> = signal(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // display cookie banner if necessary
    if (isPlatformBrowser(this.platformId)) {
      const allowCookies: string | null = localStorage.getItem('allow_cookies');
      if (!allowCookies || (allowCookies && allowCookies != 'true')) {
        setTimeout((): void => this.isVisible.set(true), 50);
      }
    }
  }

  /**
   * Accepts cookie consent and hides the cookie banner.
   *
   * Sets `allow_cookies` to `'true'` in localStorage when running in the browser,
   * then hides the banner by setting the `isVisible` signal to `false`.
   */
  protected accept(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('allow_cookies', 'true');
    }

    this.isLeaving.set(true);
    setTimeout((): void => { this.isVisible.set(false); this.isLeaving.set(false); }, 300);
  }
}
