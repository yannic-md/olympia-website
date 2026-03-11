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
import {HttpErrorResponse} from "@angular/common/http";
import {MiscService} from "../../../../services/misc/misc.service";
import {CountryForm, CountryStats, FormCountryPayload, V2Country} from "../../../../types/Country";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {CountryService} from "../../../../services/api/country/country.service";
import {AlertService} from "../../../../services/api/alert/alert.service";
import {DataHolderService} from "../../../../services/data-holder/data-holder.service";

@Component({
  selector: 'app-modal-country',
  imports: [
    FormsModule,
    NgOptimizedImage,
    TranslatePipe
  ],
  templateUrl: './modal-country.component.html',
  styleUrl: './modal-country.component.css'
})
export class ModalCountryComponent {
  isOpen: InputSignal<boolean> = input.required<boolean>();
  editData: InputSignal<CountryForm | null> = input<CountryForm | null>(null);
  existingCountries: InputSignal<CountryStats[]> = input<CountryStats[]>([]);
  closeModal: OutputEmitterRef<void> = output<void>();

  // Custom events
  countryCreated: OutputEmitterRef<CountryStats> = output<CountryStats>();
  countryUpdated: OutputEmitterRef<{ updated: CountryStats; previousId: number }> = output<{ updated: CountryStats; previousId: number }>();

  protected formData: WritableSignal<CountryForm> = signal(this.getEmptyForm());
  protected isEditMode: Signal<boolean> = computed(() => this.editData() !== null);
  protected translateMode: WritableSignal<boolean> = signal(false);
  protected isSaving: WritableSignal<boolean> = signal(false);
  protected isClosing: WritableSignal<boolean> = signal(false);
  protected isTranslateClosing: WritableSignal<boolean> = signal(false);

  constructor(protected miscService: MiscService, private translateService: TranslateService,
              private countryService: CountryService, private alertService: AlertService,
              private dataService: DataHolderService) {
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
      this.translateMode.set(true);
    } else {

      this.isTranslateClosing.set(true);
      setTimeout((): void => {
        this.isTranslateClosing.set(false);
        this.translateMode.set(false);
        this.formData.update(f => ({ ...f, nameDe: '', nameFr: '' }));
      }, 250); // matches slideDownOut duration
    }
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
    this.isClosing.set(true);

    setTimeout((): void => {
      this.isClosing.set(false);
      this.formData.set(this.getEmptyForm());
      this.translateMode.set(false);
      this.closeModal.emit();
    }, 200); // matches the longest leave duration (backdrop: 150ms, modal: 200ms)
  }

  /**
   * Submits the country form: calls the API directly and emits the result to the parent.
   * Blocks submission when a client-side duplicate is detected.
   */
  protected onSubmit(): void {
    if (this.duplicateError() || this.isSaving()) return;
    this.isSaving.set(true);

    const form: CountryForm = { ...this.formData(), translate: this.translateMode() };
    if (!this.translateMode()) { form.nameDe = undefined; form.nameFr = undefined; }

    if (this.isEditMode()) {
      this._submitUpdate(form);
    } else {
      this._submitCreate(form);
    }
  }

  /**
   * Computed signal that determines if the country form has all required fields filled and valid.
   */
  protected isFormValid: Signal<boolean> = computed((): boolean => {
    const data: CountryForm = this.formData();
    const baseValid: boolean = data.countryName.trim() !== '' && data.countryCode !== '' && !this.duplicateError() && !this.codeTooShort();
    if (!baseValid) return false;
    if (this.translateMode()) {  // check if all languages have a value
      return (data.nameDe ?? '').trim() !== '' && (data.nameFr ?? '').trim() !== '';
    }
    return true;
  });

  /**
   * Sends a create request to the API and emits `countryCreated` on success.
   *
   * @param {CountryForm} form - The validated form data.
   */
  private _submitCreate(form: CountryForm): void {
    const payload: FormCountryPayload = form.translate
      ? { code: form.countryCode.toUpperCase(), name: form.countryName,
          nameEn: form.countryName, nameDe: form.nameDe, nameFr: form.nameFr }
      : { code: form.countryCode.toUpperCase(), name: form.countryName };

    const lang: string = this.translateService.getCurrentLang();
    this.countryService.createCountry(payload).subscribe({
      next: (created: V2Country): void => {
        const displayName: string = lang === 'de' ? (created.nameDe || created.name)
                                                  : lang === 'fr' ? (created.nameFr || created.name)
                                                  : (created.nameEn || created.name);

        const newCountry: CountryStats = { countryId: created.id, countryCode: created.code, countryName: displayName,
                                           medals: { gold: 0, silver: 0, bronze: 0 }, nameEn: created.nameEn,
                                           nameDe: created.nameDe, nameFr: created.nameFr };
        this.dataService.countriesData.update(current => [...current, newCountry]);
        this.alertService.success(
          this.translateService.instant('ALERT.COUNTRY.ADD').replace('[name]', displayName));

        this.isSaving.set(false);
        this.countryCreated.emit(newCountry);
        this.close();
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error creating country:', error);
        this.isSaving.set(false);
        if (error.status !== 409) {
          this.alertService.error(
            this.translateService.instant('ALERT.COUNTRY.ADD.ERROR').replace('[name]', form.countryName));
        }
      }
    });
  }

  /**
   * Sends an update request to the API and emits `countryUpdated` on success.
   *
   * @param {CountryForm} form - The validated form data.
   */
  private _submitUpdate(form: CountryForm): void {
    const originalCode: string = (this.editData()?.countryCode ?? '').toUpperCase();
    const existing: CountryStats | undefined = this.dataService.countriesData()
      .find(c => c.countryCode.toUpperCase() === originalCode);
    if (!existing) { this.isSaving.set(false); return; }

    const payload: any = form.translate
      ? { code: form.countryCode, name: form.countryName,
          nameEn: form.countryName, nameDe: form.nameDe, nameFr: form.nameFr }
      : { code: form.countryCode, name: form.countryName, nameEn: null, nameDe: null, nameFr: null };

    const newCode: string = form.countryCode.toUpperCase();
    const lang: string = this.translateService.getCurrentLang();
    this.countryService.updateCountry(existing.countryId, payload).subscribe({
      next: (): void => {
        const displayName: string = form.translate ? (lang === 'de' ? (form.nameDe ?? form.countryName)
                                                   : lang === 'fr' ? (form.nameFr ?? form.countryName)
                                                   : form.countryName) : form.countryName;

        const updatedCountry: CountryStats = { ...existing, countryCode: newCode, countryName: displayName,
          nameEn:  form.translate ? form.countryName             : undefined,
          nameDe:  form.translate ? (form.nameDe  ?? undefined)  : undefined,
          nameFr:  form.translate ? (form.nameFr  ?? undefined)  : undefined,
        };

        // update all lists
        this.dataService.countriesData.update(current =>
          current.map(c => c.countryId !== existing.countryId ? c : updatedCountry));
        this.dataService.athletes.update(current =>
          current.map(a => a.country?.id !== existing.countryId ? a
            : { ...a, country: { ...a.country, code: newCode, name: displayName } }));
        this.dataService.sports.update(current => current.map(s => ({
          ...s, participants: s.participants.map(p => p.countryId !== existing.countryId ? p
            : { ...p, countryCode: newCode, countryName: displayName })
        })));

        this.alertService.success(
          this.translateService.instant('ALERT.COUNTRY.EDIT').replace('[name]', displayName));

        this.isSaving.set(false);
        this.countryUpdated.emit({ updated: updatedCountry, previousId: existing.countryId });
        this.close();
      },
      error: (error: HttpErrorResponse): void => {
        console.error('Error updating country:', error);
        this.isSaving.set(false);
        this.alertService.error(
          this.translateService.instant('ALERT.COUNTRY.EDIT.ERROR').replace('[name]', form.countryName));
      }
    });
  }

}
