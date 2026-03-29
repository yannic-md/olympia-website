import {Component, input, InputSignal, model, ModelSignal} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-filter-select',
  imports: [
    FormsModule,
    NgOptimizedImage
  ],
  templateUrl: './filter-select.component.html',
  styleUrl: './filter-select.component.css',
})
export class FilterSelectComponent {
  /** Optional label text displayed above the select dropdown. */
  label: InputSignal<string | undefined> = input<string>();

  /** Required identifier attribute for the HTML select element. */
  id: InputSignal<string> = input.required<string>();

  /** Two-way bound select value representing the currently selected filter option. */
  value: ModelSignal<string> = model.required<string>();

  /** Optional flag to apply bold text styling to the label. Defaults to false. */
  bold: InputSignal<boolean> = input<boolean>(false);
}
