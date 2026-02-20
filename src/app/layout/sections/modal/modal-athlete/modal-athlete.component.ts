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
import {NgClass, NgOptimizedImage} from "@angular/common";
import {animate, style, transition, trigger} from "@angular/animations";
import {MiscService} from "../../../../services/misc.service";
import {AthleteForm} from "../../../../types/Athlete";

@Component({
  selector: 'app-modal-athlete',
  imports: [FormsModule, NgOptimizedImage, NgClass],
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
  sports: InputSignal<string[]> = input.required<string[]>();
  closeModal: OutputEmitterRef<void> = output<void>();

  editData: InputSignal<AthleteForm | null> = input<AthleteForm | null>(null);
  addAthlete: OutputEmitterRef<AthleteForm> = output<AthleteForm>();
  updateAthlete: OutputEmitterRef<AthleteForm> = output<AthleteForm>();

  protected formData: WritableSignal<AthleteForm> = signal(this.getEmptyForm());
  protected bestTimeError: WritableSignal<string> = signal('');
  protected isEditMode: Signal<boolean> = computed(() => this.editData() !== null);

  constructor(protected miscService: MiscService) {
    // set data if user wants to edit instead of add
    effect((): void => {
      const data: AthleteForm | null = this.editData();
      if (data) {
        this.formData.set({ ...data });
      }
    });
  }

  /**
   * Returns an empty athlete form object with default values.
   */
  private getEmptyForm(): AthleteForm {
    return { id: 0, name: '', countryCode: '', countryName: '', sport: '',
             goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: ''};
  }

  /**
   * Updates the form data with the selected country name and its corresponding country code.
   */
  protected onCountryChange(countryName: string): void {
    const countryCode: string = this.countryCodeMap[countryName] || '';
    this.formData.update(current => ({...current, countryName, countryCode}));
  }

  /**
   * Computed signal that determines if the athlete form has all required fields filled and valid.
   *
   * Validates that name, country, and sport are provided. For race sports, additionally checks
   * that bestTime is filled and passes validation without errors.
   *
   * @returns {boolean} True if the form is valid and ready for submission, false otherwise
   */
  protected isFormValid: Signal<boolean> = computed((): boolean => {
    const data: AthleteForm = this.formData();
    const hasRequiredFields: boolean = data.name.trim() !== '' &&
      data.countryName !== '' && data.sport !== '';

    if (this.miscService.isRaceSport(data.sport)) {
      return hasRequiredFields &&
        data.bestTime.trim() !== '' &&
        this.bestTimeError() === '';
    }

    return hasRequiredFields;
  });

  /**
   * Formats the best time to the full "MM:SS.mm" or "SS.mm" format.
   * Called when the form is submitted.
   *
   * @param {string} value - The input time value to format
   * @returns {string} The formatted time string
   */
  private formatBestTime(value: string): string {
    if (!value.trim()) return '';

    const timePattern = /^(?:(\d{1,2}):)?(\d{1,2})(?:\.(\d{1,2}))?$/;
    const match: RegExpMatchArray | null = value.match(timePattern);
    if (!match) return value;

    const minutes: string = match[1] ? match[1].padStart(1, '0') : '';
    const seconds: string = match[2].padStart(2, '0');
    const milliseconds: string = match[3] ? match[3].padEnd(2, '0') : '00';

    return minutes ? `${minutes}:${seconds}.${milliseconds}` : `${seconds}.${milliseconds}`;
  }

  /**
   * Validates and formats the best time input for race sports.
   * Accepts formats like "3:24.56", "3:24", "24.56" or "24"
   * Converts incomplete formats to the full "MM:SS.mm" format.
   *
   * @param {string} value - The input time value to validate and format
   */
  protected onBestTimeChange(value: string): void {
    this.miscService.updateField(this.formData, 'bestTime', value);
    if (!value.trim()) { return; }

    const timePattern = /^(?:(\d{1,2}):)?(\d{1,2})(?:\.(\d{1,2}))?$/;
    const match = value.match(timePattern);

    if (!match) {
      this.bestTimeError.set('Ungültiges Format. Beispiel: 3:24.56 oder 3:24');
    } else {
      this.bestTimeError.set('');
    }
  }

  /**
   * Closes the modal, resets the form data to initial state, and emits the close event.
   */
  protected close(): void {
    this.formData.set(this.getEmptyForm());
    this.closeModal.emit();
  }

  /**
   * Submits the athlete form, formats the best time if applicable, and emits the data to the parent component.
   */
  protected onSubmit(): void {
    if (!this.isFormValid()) { return; }
    const submissionData = { ...this.formData() };

    // Format best time only on submit
    if (this.miscService.isRaceSport(submissionData.sport) && submissionData.bestTime) {
      submissionData.bestTime = this.formatBestTime(submissionData.bestTime);
    }

    if (this.isEditMode()) {
      this.updateAthlete.emit(submissionData);
    } else {
      this.addAthlete.emit(submissionData);
    }

    this.close();
  }

  /**
   * Maps country names to their ISO 3166-1 alpha-2 country codes.
   */
  private readonly countryCodeMap: Record<string, string> = {
    'Österreich': 'AT',
    'Schweiz': 'CH',
    'Norwegen': 'NO',
    'Deutschland': 'DE',
    'USA': 'US',
    'Polen': 'PL',
    'Japan': 'JP',
    'Frankreich': 'FR',
    'Schweden': 'SE',
    'Russland': 'RU',
    'Italien': 'IT',
    'Südkorea': 'KR',
    'Kanada': 'CA',
    'Tschechien': 'CZ',
    'Dänemark': 'DK',
    'Großbritannien': 'GB',
    'China': 'CN',
    'Niederlande': 'NL'
  };
}
