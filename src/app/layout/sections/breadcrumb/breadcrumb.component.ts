import { Component } from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {MiscService} from "../../../services/misc/misc.service";
import {TranslatePipe} from "@ngx-translate/core";

@Component({
  selector: 'app-breadcrumb',
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent {
  constructor(protected router: Router, protected miscService: MiscService) {}
}
