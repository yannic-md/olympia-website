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
  label: InputSignal<string | undefined> = input<string>();
  id: InputSignal<string> = input.required<string>();
  value: ModelSignal<string> = model.required<string>();
  bold: InputSignal<boolean> = input<boolean>(false);
}
