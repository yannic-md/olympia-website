import {Component} from '@angular/core';
import {MiscService} from "../../../services/misc/misc.service";

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  protected readonly currentYear: number = new Date().getFullYear();

  constructor(protected miscService: MiscService) {}

}
