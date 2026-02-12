import {Component} from '@angular/core';
import {Routes} from "@angular/router";
import { routes } from "../../app.routes";
import {MiscService} from "../../services/misc.service";

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  protected readonly routes: Routes = [...routes].reverse();
  protected readonly currentYear: number = new Date().getFullYear();

  constructor(protected miscService: MiscService) {}

}
