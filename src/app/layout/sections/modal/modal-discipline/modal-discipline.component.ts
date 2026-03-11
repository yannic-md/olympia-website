import {
  Component,
  computed,
  effect,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  Signal,
  signal,
  WritableSignal
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgOptimizedImage} from '@angular/common';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MiscService} from '../../../../services/misc/misc.service';
import {ScoreType, V2Athlete} from '../../../../types/Athlete';
import {DisciplineResultForm, V2Sport} from '../../../../types/Disciplines';

@Component({
  selector: 'app-modal-discipline',
  imports: [FormsModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './modal-discipline.component.html',
  styleUrl: './modal-discipline.component.css'
})
export class ModalDisciplineComponent {
  isOpen: InputSignal<boolean> = input.required<boolean>();
  athletes: InputSignal<V2Athlete[]> = input.required<V2Athlete[]>();
  sports: InputSignal<V2Sport[]> = input.required<V2Sport[]>();
  countries: InputSignal<string[]> = input.required<string[]>();
  resumeData: InputSignal<DisciplineResultForm | null> = input<DisciplineResultForm | null>(null);

  closeModal: OutputEmitterRef<void> = output<void>();
  submitResult: OutputEmitterRef<DisciplineResultForm> = output<DisciplineResultForm>();
  openAthleteModal: OutputEmitterRef<DisciplineResultForm> = output<DisciplineResultForm>();
  protected resultError: WritableSignal<string> = signal('');
  protected formData: WritableSignal<DisciplineResultForm> = signal(this.getEmptyForm());
  protected isClosing: WritableSignal<boolean> = signal(false);

  /** Athletes sorted alphabetically by name for the dropdown. */
  protected sortedAthletes: Signal<V2Athlete[]> = computed((): V2Athlete[] =>
    [...this.athletes()].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    )
  );

  constructor(protected miscService: MiscService, private translateService: TranslateService) {
    // Restore suspended form state when returning from the athlete sub-modal.
    effect((): void => {
      const data: DisciplineResultForm | null = this.resumeData();
      if (data) {
        this.formData.set({ ...data });
        this.resultError.set('');
      }
    });
  }

  /**
   * The scoreType of the currently selected sport, read directly from the sports list.
   */
  protected selectedScoreType: Signal<'TIME' | 'PTS' | 'WINS' | null> = computed((): ScoreType | null => {
    const rawName: string = this.formData().sportRawName;
    if (!rawName) return null;

    const match: V2Sport | undefined = this.sports().find(s => s.rawName === rawName);
    return match?.scoreType ?? null;
  });

  /**
   * Label key for the result input field based on the selected sport's score type.
   */
  protected resultLabelKey: Signal<string> = computed((): string => {
    switch (this.selectedScoreType()) {
      case 'PTS':  return 'MODAL.ATHLETE.POINTS';
      case 'WINS': return 'MODAL.ATHLETE.WINS';
      default:     return 'MODAL.ATHLETE.BESTTIME'; // time
    }
  });

  /**
   * Placeholder text for the result input based on score type.
   */
  protected resultPlaceholder: Signal<string> = computed((): string => {
    switch (this.selectedScoreType()) {
      case 'PTS':  return '335.30';
      case 'WINS': return '3';
      default:     return '3:24.56'; // time
    }
  });

  /**
   * Returns an empty discipline result form with default values.
   */
  private getEmptyForm(): DisciplineResultForm {
    return { athleteId: 0, athleteName: '', sportRawName: '', medal: 'gold', resultValue: '' };
  }

  /**
   * Handles sport dropdown changes: updates the sport and resets the result field and its error.
   *
   * @param {string} rawName - The rawName of the selected sport.
   */
  protected onSportChange(rawName: string): void {
    this.formData.update(f => ({ ...f, sportRawName: rawName, resultValue: '' }));
    this.resultError.set('');
  }

  /**
   * Validates the result value based on the active score type.
   *
   * @param {string} value - The entered result string to validate.
   */
  protected onResultChange(value: string): void {
    this.miscService.updateField(this.formData, 'resultValue', value);
    const type: 'TIME' | 'PTS' | 'WINS' | null = this.selectedScoreType();

    if (!value.trim()) { this.resultError.set(''); return; }

    if (type === 'TIME') {
      const valid: boolean = /^(\d{1,2}:)?\d{1,2}(:\d{2})?(\.\d{1,3})?$/.test(value.trim());
      this.resultError.set(valid ? '' : this.translateService.instant('MODAL.ATHLETE.ERROR.BESTTIME'));
    } else if (type === 'PTS') {
      const valid: boolean = /^\d+(\.\d{1,2})?$/.test(value.trim());
      this.resultError.set(valid ? '' : this.translateService.instant('MODAL.ATHLETE.ERROR.POINTS'));
    } else if (type === 'WINS') {
      const valid: boolean = /^\d+$/.test(value.trim());
      this.resultError.set(valid ? '' : this.translateService.instant('MODAL.ATHLETE.ERROR.WINS'));
    } else {
      this.resultError.set('');
    }
  }

  /**
   * Validates that the entered result value is not worse than existing medal results
   * for the currently selected sport.
   *
   * Rules per score type:
   *  - TIME:  lower is better  → new value must be ≤ existing values for lower-ranked medals
   *  - PTS:   higher is better → new value must be ≥ existing values for lower-ranked medals
   *  - WINS:  higher is better → same as PTS
   *
   * @returns an i18n key string when invalid, or '' when valid.
   */
  protected rankingError: Signal<string> = computed((): string => {
    const form: DisciplineResultForm = this.formData();
    if (!form.sportRawName || !form.resultValue.trim() || !form.medal) return '';

    const type: "TIME" | "PTS" | "WINS" | null = this.selectedScoreType();
    if (!type) return '';

    const numericValue: number | null = this.parseScore(form.resultValue.trim(), type);
    if (numericValue === null) return ''; // format error handled separately

    const sport: V2Sport | undefined = this.sports().find(s => s.rawName === form.sportRawName);
    if (!sport) return '';

    // Medal rank order: gold=1 is best, bronze=3 is worst
    const medalRank: Record<string, number> = { gold: 1, silver: 2, bronze: 3 };
    const currentRank: number = medalRank[form.medal];

    for (const participant of sport.participants) {
      if (!participant.medal || !participant.result) continue;
      const otherMedal = participant.medal.toLowerCase() as 'gold' | 'silver' | 'bronze';
      const otherRank: number = medalRank[otherMedal];
      if (otherRank === currentRank) continue; // Skip same medal (own entry being edited)

      const otherValue: number | null = this.parseScore(participant.result, type);
      if (otherValue === null) continue;

      if (type === 'TIME') {
        // - My time must be ≤ a worse medal's time  (otherRank > currentRank → I should be faster)
        // - My time must be ≥ a better medal's time (otherRank < currentRank → I should be slower)
        if (otherRank > currentRank && numericValue > otherValue) return 'MODAL.DISCIPLINE.ERROR.RANKING';
        if (otherRank < currentRank && numericValue < otherValue) return 'MODAL.DISCIPLINE.ERROR.RANKING';
      } else {
        // - My score must be ≥ a worse medal's score  (otherRank > currentRank → I should score more)
        // - My score must be ≤ a better medal's score (otherRank < currentRank → I should score less)
        if (otherRank > currentRank && numericValue < otherValue) return 'MODAL.DISCIPLINE.ERROR.RANKING';
        if (otherRank < currentRank && numericValue > otherValue) return 'MODAL.DISCIPLINE.ERROR.RANKING';
      }
    }
    return '';
  });

  /**
   * Parses a score string into a comparable number.
   * TIME format "[[h:]mm:]ss[.ms]" is converted to total seconds.
   * PTS and WINS are parsed as plain floats / integers.
   * Strips trailing unit suffixes (" pts", " wins") before parsing.
   *
   * @param value The raw result string.
   * @param type  The score type.
   * @returns A comparable number, or null when parsing fails.
   */
  private parseScore(value: string, type: 'TIME' | 'PTS' | 'WINS'): number | null {
    const formattedValue: string = value.trim().replace(/\s*(pts|wins)$/i, '');
    if (!formattedValue) return null;

    if (type === 'TIME') {
      const parts: number[] = formattedValue.split(':').map(Number);
      if (parts.some(isNaN)) return null;
      if (parts.length === 1) return parts[0];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return null;
    }

    const numberValue: number = parseFloat(formattedValue);
    return isNaN(numberValue) ? null : numberValue;
  }

  /**
   * Updates the selected athlete by ID, carrying over the athlete's name for display.
   *
   * @param {number} athleteId - The ID of the selected athlete.
   */
  protected onAthleteChange(athleteId: number): void {
    const id: number = Number(athleteId);
    const athlete: V2Athlete | undefined = this.athletes().find(a => a.id === id);
    this.formData.update(f => ({ ...f, athleteId: id,
      athleteName: athlete ? `${athlete.firstName} ${athlete.lastName}` : '' }));
  }

  /**
   * Computed signal — true when all required fields are filled and no validation errors exist.
   */
  protected isFormValid: Signal<boolean> = computed((): boolean => {
    const f: DisciplineResultForm = this.formData();
    if (!f.athleteId || !f.sportRawName || !f.medal) return false;
    if (!f.resultValue.trim()) return false;
    if (this.resultError() !== '') return false;

    return this.rankingError() === '';
  });

  /**
   * Emits the current form snapshot upward so the parent can open the athlete modal.
   * The parent is responsible for suspending and later restoring this snapshot via resumeData.
   */
  protected onOpenAthleteModal(): void {
    this.openAthleteModal.emit({ ...this.formData() });
  }

  /**
   * Closes the modal and resets the form to its empty default state.
   */
  protected close(): void {
    this.isClosing.set(true);

    setTimeout((): void => {
      this.isClosing.set(false);
      this.formData.set(this.getEmptyForm());
      this.resultError.set('');
      this.closeModal.emit();
    }, 200);
  }

  /**
   * Submits the discipline result form and emits it to the parent component.
   */
  protected onSubmit(): void {
    if (!this.isFormValid()) return;
    this.submitResult.emit({ ...this.formData() });
    this.close();
  }
}

