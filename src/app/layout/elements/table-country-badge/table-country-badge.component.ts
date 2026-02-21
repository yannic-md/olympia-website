import {Component, input, InputSignal} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-table-country-badge',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './table-country-badge.component.html',
  styleUrl: './table-country-badge.component.css',
})
export class TableCountryBadgeComponent {
  code: InputSignal<string> = input.required<string>();
  name: InputSignal<string> = input.required<string>();

  protected isError: boolean = false;
  protected flagUrl: () => string = (): string => `https://flagcdn.com/h20/${this.code().toLowerCase()}.png`;
}
