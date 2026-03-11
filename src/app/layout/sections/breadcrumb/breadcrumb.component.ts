import {Component, Inject, PLATFORM_ID} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {isPlatformBrowser} from "@angular/common";
import {MiscService} from "../../../services/misc/misc.service";
import {TranslatePipe} from "@ngx-translate/core";

@Component({
  selector: 'app-breadcrumb',
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent {
  protected skipEntryAnimation: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
              protected router: Router, protected miscService: MiscService) {
    if (isPlatformBrowser(this.platformId)) {
      // Don't replay the animation after an in-app route change – only on the initial page load.
      this.skipEntryAnimation = document.readyState === 'complete';
    }
  }
}
