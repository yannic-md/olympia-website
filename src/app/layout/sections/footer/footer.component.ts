import {Component, Inject, PLATFORM_ID} from '@angular/core';
import {MiscService} from "../../../services/misc/misc.service";
import {TranslatePipe} from "@ngx-translate/core";
import {isPlatformBrowser} from "@angular/common";

@Component({
  selector: 'app-footer',
  imports: [
    TranslatePipe
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  protected readonly currentYear: number = new Date().getFullYear();
  protected skipEntryAnimation: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, protected miscService: MiscService) {
    if (isPlatformBrowser(this.platformId)) {
      // Don't replay the animation after an in-app route change – only on the initial page load.
      this.skipEntryAnimation = document.readyState === 'complete';
    }
  }

}
