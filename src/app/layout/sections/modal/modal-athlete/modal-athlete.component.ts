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
import {HttpErrorResponse} from "@angular/common/http";
import {MiscService} from "../../../../services/misc/misc.service";
import {AthleteForm, V2Athlete} from "../../../../types/Athlete";
import {CountryStats} from "../../../../types/Country";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {AthleteService} from "../../../../services/api/athlete/athlete.service";
import {DataHolderService} from "../../../../services/data-holder/data-holder.service";
import {AlertService} from "../../../../services/api/alert/alert.service";

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
  athletes: InputSignal<V2Athlete[]> = input.required<V2Athlete[]>();
  countries: InputSignal<string[]> = input.required<string[]>();
  closeModal: OutputEmitterRef<void> = output<void>();
  openCountryModal: OutputEmitterRef<AthleteForm> = output<AthleteForm>();

  editData: InputSignal<AthleteForm | null> = input<AthleteForm | null>(null);
  resumeData: InputSignal<AthleteForm | null> = input<AthleteForm | null>(null);
  athleteCreated: OutputEmitterRef<V2Athlete> = output<V2Athlete>();
  updateAthlete: OutputEmitterRef<AthleteForm> = output<AthleteForm>();

  protected formData: WritableSignal<AthleteForm> = signal(this.getEmptyForm());
  protected nameError: WritableSignal<string> = signal('');
  protected isEditMode: Signal<boolean> = computed((): boolean => this.editData() !== null);

  constructor(protected miscService: MiscService, private translateService: TranslateService,
              private athleteService: AthleteService, private dataService: DataHolderService,
              private alertService: AlertService) {
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
    return this.athletes().some((a: V2Athlete): boolean => {
      if (this.isEditMode() && a.id === this.editData()!.id) return false;
      return `${a.firstName} ${a.lastName}`.trim().toLowerCase() === currentName;
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
   * Submits the athlete form.
   */
  protected onSubmit(): void {
    if (!this.isFormValid()) { return; }

    if (this.isEditMode()) {
      this.updateAthlete.emit({ ...this.formData() });
      this.close();
      return;
    }

    this._submitCreate({ ...this.formData() });
  }

  /**
   * Calls the athlete creation API, patches all local stores and emits `athleteCreated`.
   *
   * @param {AthleteForm} form - The validated form data.
   */
  private _submitCreate(form: AthleteForm): void {
    const { firstName, lastName, countryId } = this._splitNameAndCountry(form);

    this.athleteService.createAthlete({ firstName, lastName, countryId }).subscribe({
      next: (api: V2Athlete): void => {
        this.athleteService.patchAthleteAdd(api);
        this.alertService.success(
          this.translateService.instant('ALERT.ATHLETE.ADD').replace('[name]', `${api.firstName} ${api.lastName}`));

        this.close();
        this.athleteCreated.emit(api);
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error creating athlete:', error);
        this.alertService.error(
          this.translateService.instant('ALERT.ATHLETE.ADD.ERROR').replace('[name]', form.name));
      }
    });
  }

  /**
   * Splits a full name and resolves the countryId from the countries data.
   */
  private _splitNameAndCountry(form: AthleteForm): { firstName: string; lastName: string; countryId: number } {
    const parts: string[] = form.name.trim().split(/\s+/);
    const country: CountryStats | undefined =
      this.dataService.countriesData().find(c => c.countryName === form.countryName);

    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '',
             countryId: country?.countryId ?? 0 };
  }
}
