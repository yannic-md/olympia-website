import {Component, computed, input, InputSignal, Signal} from '@angular/core';

@Component({
  selector: 'app-table-medal-pills',
  imports: [],
  templateUrl: './table-medal-pills.component.html',
  styleUrl: './table-medal-pills.component.css',
})
export class TableMedalPillsComponent {
  medals: InputSignal<{ gold: number; silver: number; bronze: number }> = input.required<{ gold: number; silver: number; bronze: number }>();
  activeFilter: InputSignal<'all' | 'gold' | 'silver' | 'bronze'> = input<'all' | 'gold' | 'silver' | 'bronze'>('all');

  /**
   * Computes the list of medal objects to display based on the current filter.
   * Returns either all medals or only the filtered medal type, including their count and CSS class.
   */
  protected displayMedals: Signal<any> = computed(() => {
    const list = [
      { type: 'gold', count: this.medals().gold, css: 'bg-[rgb(252,200,97)]' },
      { type: 'silver', count: this.medals().silver, css: 'bg-[rgb(229,229,229)]' },
      { type: 'bronze', count: this.medals().bronze, css: 'bg-[rgb(220,179,134)]' }
    ];

    return this.activeFilter() === 'all' ? list
                                         : list.filter(m => m.type === this.activeFilter());
  });
}
