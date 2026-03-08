import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TableCountryBadgeComponent } from '../table-country-badge/table-country-badge.component';
import {AuthService} from "../../../services/api/auth/auth.service";
import {NgOptimizedImage} from "@angular/common";
import {DisciplineWinner, MedalType} from "../../../types/Disciplines";

@Component({
  selector: 'app-discipline-winner-row',
  imports: [TranslatePipe, TableCountryBadgeComponent, NgOptimizedImage],
  templateUrl: './discipline-winner-row.component.html',
  styleUrls: ['./discipline-winner-row.component.css']
})
export class DisciplineWinnerRowComponent {
  medal: InputSignal<string> = input.required<string>();
  medalType: InputSignal<'gold' | 'silver' | 'bronze'> = input.required<'gold' | 'silver' | 'bronze'>();
  activeFilter: InputSignal<'all' | 'gold' | 'silver' | 'bronze'> = input.required<'all' | 'gold' | 'silver' | 'bronze'>();
  winner: InputSignal<DisciplineWinner | null> = input.required<DisciplineWinner | null>();

  /** Emits the medal type when the delete button is clicked. */
  deleteWinner: OutputEmitterRef<MedalType> = output<MedalType>();

  constructor(protected authService: AuthService, private translateService: TranslateService) {}

  /**
   * Returns the result string with a localised suffix appended for PTS and WINS score types.
   * TIME results are returned as-is.
   *
   * @param {DisciplineWinner} winner - The winner whose result should be formatted.
   * @returns {string} The formatted result string.
   */
  protected formatResult(winner: DisciplineWinner): string {
    // Strip any legacy suffix stored in older DB rows before applying the localised label.
    const raw: string = (winner.result ?? '').replace(/\s*(pts|wins)$/i, '').trim();
    if (!raw) return '';
    if (winner.scoreType === 'PTS')  return `${raw} ${this.translateService.instant('MODAL.ATHLETE.POINTS')}`;
    if (winner.scoreType === 'WINS') return `${raw} ${this.translateService.instant('MODAL.ATHLETE.WINS')}`;
    return raw;
  }
}
