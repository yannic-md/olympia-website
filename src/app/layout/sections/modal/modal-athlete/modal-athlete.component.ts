import {
  Component,
  computed, effect,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  Signal,
  signal,
  WritableSignal
} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";
import {animate, style, transition, trigger} from "@angular/animations";
import {MiscService} from "../../../../services/misc/misc.service";
import {AthleteForm, ScoreType} from "../../../../types/Athlete";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-modal-athlete',
  imports: [FormsModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './modal-athlete.component.html',
  styleUrl: './modal-athlete.component.css',
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
export class ModalAthleteComponent {
  isOpen: InputSignal<boolean> = input.required<boolean>();
  countries: InputSignal<string[]> = input.required<string[]>();
  sports: InputSignal<{ name: string; rawName: string; scoreType: ScoreType }[]> = input.required<{ name: string; rawName: string; scoreType: ScoreType }[]>();
  closeModal: OutputEmitterRef<void> = output<void>();

  editData: InputSignal<AthleteForm | null> = input<AthleteForm | null>(null);
  addAthlete: OutputEmitterRef<AthleteForm> = output<AthleteForm>();
  updateAthlete: OutputEmitterRef<AthleteForm> = output<AthleteForm>();

  protected formData: WritableSignal<AthleteForm> = signal(this.getEmptyForm());
  protected scoreError: WritableSignal<string> = signal('');
  protected isEditMode: Signal<boolean> = computed((): boolean => this.editData() !== null);

  /** The active scoreType based on the currently selected sport */
  protected activeScoreType: Signal<ScoreType | null> = computed((): ScoreType | null => this.formData().scoreType);

  protected readonly scoreTypeLabels: Record<ScoreType, string> = {
    TIME: 'MODAL.ATHLETE.BESTTIME', PTS: 'MODAL.ATHLETE.POINTS', WINS: 'MODAL.ATHLETE.WINS'};

  protected readonly scoreTypePlaceholders: Record<ScoreType, string> = {
    TIME: '3:24.56', PTS:  '335.30', WINS: '12'};

  constructor(protected miscService: MiscService, private translateService: TranslateService) {
    // set data if user wants to edit instead of add
    effect((): void => {
      const data: AthleteForm | null = this.editData();
      if (data) {
        this.formData.set({ ...data });
        this.scoreError.set('');
      }
    });
  }

  /**
   * Returns an empty athlete form object with default values.
   */
  private getEmptyForm(): AthleteForm {
    return { id: 0, name: '', countryCode: '', countryName: '', sport: '',
             sportRawName: '', scoreType: null, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' };
  }

  /**
   * Updates the form data with the selected country name and its corresponding country code.
   */
  protected onCountryChange(countryName: string): void {
    this.formData.update(current => ({ ...current, countryName, countryCode: '' }));
  }

  /**
   * Updates the selected sport and derives the scoreType from the sports input list.
   * Resets the score input field to avoid stale validation state.
   */
  protected onSportChange(sport: string): void {
    const entry = this.sports().find(s => s.name === sport);
    const scoreType: ScoreType | null = entry?.scoreType ?? null;
    const sportRawName: string = entry?.rawName ?? sport;

    this.formData.update(current => ({ ...current, sport, sportRawName, scoreType, bestTime: '' }));
    this.scoreError.set('');
  }

  /**
   * Computed signal — true when all required fields are filled and the score input is valid.
   */
  protected isFormValid: Signal<boolean> = computed((): boolean => {
    const data: AthleteForm = this.formData();
    if (!data.name.trim() || !data.countryName || !data.sport) return false;
    if (this.scoreError() !== '') return false;

    // Score field is required only when a scoreType is known
    return !(data.scoreType !== null && data.bestTime.trim() === '');
  });

  /**
   * Validates the score input field based on the active scoreType.
   * TIME: MM:SS.mm / SS.mm / SS
   * PTS:  positive decimal number
   * WINS: non-negative integer
   *
   * @param {string} value - The value to set
   */
  protected onScoreInputChange(value: string): void {
    this.miscService.updateField(this.formData, 'bestTime', value);
    if (!value.trim()) {
      this.scoreError.set('');
      return;
    }

    const scoreType: ScoreType | null = this.formData().scoreType;

    if (scoreType === 'TIME') {
      const valid: boolean = /^(?:\d{1,2}:)?\d{1,2}(?:\.\d{1,2})?$/.test(value);
      this.scoreError.set(valid ? '' : this.translateService.instant('MODAL.ATHLETE.ERROR.BESTTIME'));
    } else if (scoreType === 'PTS') {
      const valid: boolean = /^\d+(\.\d+)?$/.test(value);
      this.scoreError.set(valid ? '' : this.translateService.instant('MODAL.ATHLETE.ERROR.POINTS'));
    } else if (scoreType === 'WINS') {
      const valid: boolean = /^\d+$/.test(value);
      this.scoreError.set(valid ? '' : this.translateService.instant('MODAL.ATHLETE.ERROR.WINS'));
    } else {
      this.scoreError.set('');
    }
  }

  /**
   * Formats the best time to a canonical "M:SS.mm" or "SS.mm" format before submission.
   *
   * @param {string} value - The input time value to format
   * @returns {string} The formatted time string
   */
  private formatBestTime(value: string): string {
    if (!value.trim()) return '';
    const match: RegExpMatchArray | null = value.match(/^(?:(\d{1,2}):)?(\d{1,2})(?:\.(\d{1,2}))?$/);
    if (!match) return value;

    const minutes: string = match[1] ?? '';
    const seconds: string = match[2].padStart(2, '0');
    const ms: string = match[3] ? match[3].padEnd(2, '0') : '00';
    return minutes ? `${minutes}:${seconds}.${ms}` : `${seconds}.${ms}`;
  }

  /**
   * Closes the modal, resets the form data to initial state, and emits the close event.
   */
  protected close(): void {
    this.formData.set(this.getEmptyForm());
    this.scoreError.set('');
    this.closeModal.emit();
  }

  /**
   * Submits the athlete form, formats TIME values and emits to the parent.
   */
  protected onSubmit(): void {
    if (!this.isFormValid()) { return; }
    const submissionData = { ...this.formData() };

    if (submissionData.scoreType === 'TIME' && submissionData.bestTime) {
      submissionData.bestTime = this.formatBestTime(submissionData.bestTime);
    }

    if (this.isEditMode()) {
      this.updateAthlete.emit(submissionData);
    } else {
      this.addAthlete.emit(submissionData);
    }

    this.close();
  }
}
