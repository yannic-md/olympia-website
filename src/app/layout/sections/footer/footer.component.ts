import {Component} from '@angular/core';
import {MiscService} from "../../../services/misc/misc.service";
import {TranslatePipe} from "@ngx-translate/core";

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

  constructor(protected miscService: MiscService) {}

}
