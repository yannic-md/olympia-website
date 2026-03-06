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
import {animate, style, transition, trigger} from '@angular/animations';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MiscService} from '../../../../services/misc/misc.service';
import {Athlete, ScoreType} from '../../../../types/Athlete';
import {SportEntry} from '../../../../services/api/sports/sports.service';
import {DisciplineResultForm} from "../../../../types/Disciplines";

@Component({
  selector: 'app-modal-discipline',
  imports: [FormsModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './modal-discipline.component.html',
  styleUrl: './modal-discipline.component.css',
  animations: [
    trigger('backdropFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-20px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(-20px)' }))
      ])
    ])
  ]
})
export class ModalDisciplineComponent {
  isOpen: InputSignal<boolean> = input.required<boolean>();
  athletes: InputSignal<Athlete[]> = input.required<Athlete[]>();
  sports: InputSignal<SportEntry[]> = input.required<SportEntry[]>();
  countries: InputSignal<string[]> = input.required<string[]>();
  resumeData: InputSignal<DisciplineResultForm | null> = input<DisciplineResultForm | null>(null);

  closeModal: OutputEmitterRef<void> = output<void>();
  submitResult: OutputEmitterRef<DisciplineResultForm> = output<DisciplineResultForm>();
  openAthleteModal: OutputEmitterRef<DisciplineResultForm> = output<DisciplineResultForm>();
  protected resultError: WritableSignal<string> = signal('');
  protected formData: WritableSignal<DisciplineResultForm> = signal(this.getEmptyForm());

  /** Athletes sorted alphabetically by name for the dropdown. */
  protected sortedAthletes: Signal<Athlete[]> = computed((): Athlete[] =>
    [...this.athletes()].sort((a, b) => a.name.localeCompare(b.name))
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

    const match: SportEntry | undefined = this.sports().find(s => s.rawName === rawName);
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
   * Updates the selected athlete by ID, carrying over the athlete's name for display.
   *
   * @param {number} athleteId - The ID of the selected athlete.
   */
  protected onAthleteChange(athleteId: number): void {
    const id: number = Number(athleteId);
    const athlete: Athlete | undefined = this.athletes().find(a => a.id === id);

    this.formData.update(f => ({ ...f, athleteId: id, athleteName: athlete?.name ?? '' }));
  }

  /**
   * Computed signal — true when all required fields are filled and no validation errors exist.
   */
  protected isFormValid: Signal<boolean> = computed((): boolean => {
    const f: DisciplineResultForm = this.formData();
    if (!f.athleteId || !f.sportRawName || !f.medal) return false;
    if (!f.resultValue.trim()) return false;

    return this.resultError() === '';
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
    this.formData.set(this.getEmptyForm());
    this.resultError.set('');
    this.closeModal.emit();
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

