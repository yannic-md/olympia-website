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
import {CountryForm, CountryStats} from "../../../../types/Country";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-modal-country',
  imports: [
    FormsModule,
    NgOptimizedImage,
    TranslatePipe
  ],
  templateUrl: './modal-country.component.html',
  styleUrl: './modal-country.component.css',
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
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)', maxHeight: '0', overflow: 'hidden' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)', maxHeight: '200px', overflow: 'hidden' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(0)', maxHeight: '200px', overflow: 'hidden' }),
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)', maxHeight: '0', overflow: 'hidden' }))
      ])
    ])
  ]
})
export class ModalCountryComponent {
  isOpen: InputSignal<boolean> = input.required<boolean>();
  editData: InputSignal<CountryForm | null> = input<CountryForm | null>(null);
  /** Full list of existing countries used for client-side duplicate validation. */
  existingCountries: InputSignal<CountryStats[]> = input<CountryStats[]>([]);

  closeModal: OutputEmitterRef<void> = output<void>();
  addCountry: OutputEmitterRef<CountryForm> = output<CountryForm>();
  updateCountry: OutputEmitterRef<CountryForm> = output<CountryForm>();

  protected formData: WritableSignal<CountryForm> = signal(this.getEmptyForm());
  protected isEditMode: Signal<boolean> = computed(() => this.editData() !== null);
  protected translateMode: WritableSignal<boolean> = signal(false);

  constructor(protected miscService: MiscService, private translateService: TranslateService) {
    // set data if user wants to edit instead of add
    effect((): void => {
      const data: CountryForm | null = this.editData();
      if (data) {
        this.formData.set({ ...data });
        this.translateMode.set(data.translate ?? false);
      }
    });
  }

  /**
   * Toggles translate mode. When activating, moves the current countryName value into
   * the translation field matching the user's active language, then clears countryName
   * so it can receive the English/base name.
   *
   * @param {boolean} enabled - Whether translate mode is being enabled or disabled.
   */
  protected onTranslateModeChange(enabled: boolean): void {
    if (enabled) {
      const currentName: string = this.formData().countryName.trim();
      if (currentName) {
        const lang: string = this.translateService.getCurrentLang();
        if (lang === 'de') {
          this.formData.update(f => ({ ...f, countryName: '', nameDe: currentName }));
        } else if (lang === 'fr') {
          this.formData.update(f => ({ ...f, countryName: '', nameFr: currentName }));
        }

        // For 'en' the value already belongs in countryName (the EN/base field), so no move needed.
      }
    } else {
      this.formData.update(f => ({ ...f, nameDe: '', nameFr: '' }));
    }

    this.translateMode.set(enabled);
  }

  /**
   * Returns true if the country code has been entered but is shorter than 2 characters.
   */
  protected codeTooShort: Signal<boolean> = computed((): boolean => {
    const code: string = this.formData().countryCode.trim();
    return code.length > 0 && code.length < 2;
  });

  /**
   * Checks whether the entered country code or any of the name fields already exists in the
   * current country list. Only active in add-mode (not when editing an existing country).
   * Returns null if no duplicate is found, or an object describing which fields conflict.
   */
  protected duplicateError: Signal<{ code: boolean; name: boolean; nameDe: boolean; nameFr: boolean } | null> = computed(() => {
    if (this.isEditMode()) return null;

    const existing: CountryStats[] = this.existingCountries();
    const normalize: (s: string) => string = (s: string): string => s.trim().toLowerCase();

    const existingNames: Set<string> = new Set(existing.flatMap(c => [
      normalize(c.countryName),
      ...(c.nameEn ? [normalize(c.nameEn)] : []),
      ...(c.nameDe ? [normalize(c.nameDe)] : []),
      ...(c.nameFr ? [normalize(c.nameFr)] : []),
    ]));

    const code: string   = this.formData().countryCode.toUpperCase().trim();
    const name: string   = normalize(this.formData().countryName);
    const nameDe: string = normalize(this.formData().nameDe ?? '');
    const nameFr: string = normalize(this.formData().nameFr ?? '');

    const codeExists: boolean  = code.length > 0   && existing.some(c => c.countryCode.toUpperCase() === code);
    const nameExists: boolean  = name.length > 0   && existingNames.has(name);
    const nameDeExists: boolean = this.translateMode() && nameDe.length > 0 && existingNames.has(nameDe);
    const nameFrExists: boolean = this.translateMode() && nameFr.length > 0 && existingNames.has(nameFr);

    return (codeExists || nameExists || nameDeExists || nameFrExists)
      ? { code: codeExists, name: nameExists, nameDe: nameDeExists, nameFr: nameFrExists }
      : null;
  });

  /**
   * Returns an empty country form object with default values.
   */
  private getEmptyForm(): CountryForm {
    return { countryCode: '', countryName: '', goldMedals: 0, silverMedals: 0, bronzeMedals: 0,
             translate: false, nameDe: '', nameFr: '' };
  }

  /**
   * Closes the modal, resets the form data to initial state, and emits the close event.
   */
  protected close(): void {
    this.formData.set(this.getEmptyForm());
    this.translateMode.set(false);
    this.closeModal.emit();
  }

  /**
   * Submits the country form and emits the data to the parent component.
   * Blocks submission when a client-side duplicate is detected.
   */
  protected onSubmit(): void {
    if (this.duplicateError()) return;

    const payload: CountryForm = { ...this.formData(), translate: this.translateMode() };
    if (!this.translateMode()) { payload.nameDe = undefined; payload.nameFr = undefined; }

    if (this.isEditMode()) {
      this.updateCountry.emit(payload);
    } else {
      this.addCountry.emit(payload);
    }

    this.close();
  }

  /**
   * Computed signal that determines if the country form has all required fields filled and valid.
   */
  protected isFormValid: Signal<boolean> = computed((): boolean => {
    const data: CountryForm = this.formData();
    const baseValid: boolean = data.countryName.trim() !== '' && data.countryCode !== '' && !this.duplicateError() && !this.codeTooShort();
    if (!baseValid) return false;
    if (this.translateMode()) {
      return (data.nameDe ?? '').trim() !== '' && (data.nameFr ?? '').trim() !== '';
    }
    return true;
  });

}
