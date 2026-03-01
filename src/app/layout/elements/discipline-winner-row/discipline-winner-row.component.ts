import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TableCountryBadgeComponent } from '../table-country-badge/table-country-badge.component';
import { DisciplineWinner, MedalType } from '../../../types/Disciplines';
import {AuthService} from "../../../services/api/auth/auth.service";
import {NgOptimizedImage} from "@angular/common";

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

  constructor(protected authService: AuthService) {}
}
