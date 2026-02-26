import {Component, input, InputSignal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-disciplines-view',
  imports: [TranslatePipe],
  templateUrl: './disciplines-view.component.html',
  styleUrls: ['./disciplines-view.component.css']
})
export class DisciplinesViewComponent {
  filterCountry: InputSignal<string> = input.required<string>();
  filterMedal: InputSignal<'all' | 'gold' | 'silver' | 'bronze'> = input.required<'all' | 'gold' | 'silver' | 'bronze'>();
  searchQuery: InputSignal<string> = input.required<string>();
}
