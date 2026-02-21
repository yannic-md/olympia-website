import {Component, Inject, PLATFORM_ID} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {TranslateService} from "@ngx-translate/core";
import {isPlatformBrowser} from "@angular/common";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'olympia-website-new';

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private translateService: TranslateService) {
    if (isPlatformBrowser(this.platformId)) {
      // get language if already saved
      if (localStorage.getItem('lang') != null) {
        switch (localStorage.getItem('lang')) {
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
      }

      // get browser language if not saved
      const lang: string = this.translateService.getBrowserLang() || 'de';
      if (lang === 'de' || lang === 'en' || lang === 'fr') {
        this.translateService.use(lang);
      }
    }
  }
}
