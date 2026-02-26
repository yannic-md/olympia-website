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
import {Athlete, AthleteForm} from "../../../../types/Athlete";
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
  athletes: InputSignal<Athlete[]> = input.required<Athlete[]>();
  countries: InputSignal<string[]> = input.required<string[]>();
  closeModal: OutputEmitterRef<void> = output<void>();
  openCountryModal: OutputEmitterRef<AthleteForm> = output<AthleteForm>();

  editData: InputSignal<AthleteForm | null> = input<AthleteForm | null>(null);
  /** Restores a previously suspended form state (e.g. after returning from country creation). Does not activate edit mode. */
  resumeData: InputSignal<AthleteForm | null> = input<AthleteForm | null>(null);
  addAthlete: OutputEmitterRef<AthleteForm> = output<AthleteForm>();
  updateAthlete: OutputEmitterRef<AthleteForm> = output<AthleteForm>();

  protected formData: WritableSignal<AthleteForm> = signal(this.getEmptyForm());
  protected nameError: WritableSignal<string> = signal('');
  protected isEditMode: Signal<boolean> = computed((): boolean => this.editData() !== null);

  constructor(protected miscService: MiscService, private translateService: TranslateService) {
    // set data if user wants to edit instead of add
    effect((): void => {
      const data: AthleteForm | null = this.editData();
      if (data) {
        this.formData.set({ ...data });
        this.nameError.set('');
      }
    });

    // restore suspended form state when returning from country creation
    effect((): void => {
      const data: AthleteForm | null = this.resumeData();
      if (data) {
        this.formData.set({ ...data });
        this.nameError.set('');
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
   * Returns true when the entered athlete name already exists in the athletes list.
   * In edit mode the athlete's own current name is excluded from the check.
   */
  protected duplicateNameError: Signal<boolean> = computed((): boolean => {
    const currentName: string = this.formData().name.trim().toLowerCase();
    if (!currentName) return false;
    return this.athletes().some((a: Athlete): boolean => {
      if (this.isEditMode() && a.id === this.editData()!.id) return false;
      return a.name.trim().toLowerCase() === currentName;
    });
  });

  /**
   * Computed signal — true when all required fields are filled and no validation errors exist.
   */
  protected isFormValid: Signal<boolean> = computed((): boolean => {
    const data: AthleteForm = this.formData();
    if (!data.name.trim() || !data.countryName) return false;
    if (this.nameError() !== '') return false;
    return !this.duplicateNameError();
  });

  /**
   * Validates that the athlete name contains at least a first and last name separated by a space.
   *
   * @param {string} value - The name value to validate
   */
  protected onNameChange(value: string): void {
    this.miscService.updateField(this.formData, 'name', value);
    const parts: string[] = value.trim().split(/\s+/);
    if (value.trim() && parts.length < 2) {
      this.nameError.set(this.translateService.instant('MODAL.ATHLETE.NAME.ERROR'));
    } else {
      this.nameError.set('');
    }
  }

  /**
   * Closes the modal, resets the form data to initial state, and emits the close event.
   */
  protected close(): void {
    this.formData.set(this.getEmptyForm());
    this.nameError.set('');
    this.closeModal.emit();
  }

  /**
   * Submits the athlete form and emits to the parent.
   */
  protected onSubmit(): void {
    if (!this.isFormValid()) { return; }

    if (this.isEditMode()) {
      this.updateAthlete.emit({ ...this.formData() });
    } else {
      this.addAthlete.emit({ ...this.formData() });
    }

    this.close();
  }
}
