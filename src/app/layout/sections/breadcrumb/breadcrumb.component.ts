import { Component } from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {MiscService} from "../../../services/misc.service";

@Component({
  selector: 'app-breadcrumb',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent {
  constructor(protected router: Router, protected miscService: MiscService) {}
}
