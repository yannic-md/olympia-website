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
import {CountryForm} from "../../../../types/Country";

@Component({
  selector: 'app-modal-country',
  imports: [
    FormsModule,
    NgOptimizedImage
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
    ])
  ]
})
export class ModalCountryComponent {
  isOpen: InputSignal<boolean> = input.required<boolean>();
  editData: InputSignal<CountryForm | null> = input<CountryForm | null>(null);

  closeModal: OutputEmitterRef<void> = output<void>();
  addCountry: OutputEmitterRef<CountryForm> = output<CountryForm>();
  updateCountry: OutputEmitterRef<CountryForm> = output<CountryForm>();

  protected formData: WritableSignal<CountryForm> = signal(this.getEmptyForm());
  protected isEditMode: Signal<boolean> = computed(() => this.editData() !== null);

  constructor(protected miscService: MiscService) {
    // set data if user wants to edit instead of add
    effect((): void => {
      const data: CountryForm | null = this.editData();
      if (data) { this.formData.set({ ...data }); }
    });
  }

  /**
   * Returns an empty country form object with default values.
   */
  private getEmptyForm(): CountryForm {
    return { countryCode: '', countryName: '', goldMedals: 0, silverMedals: 0, bronzeMedals: 0};
  }

  /**
   * Closes the modal, resets the form data to initial state, and emits the close event.
   */
  protected close(): void {
    this.formData.set(this.getEmptyForm());
    this.closeModal.emit();
  }

  /**
   * Submits the country form and emits the data to the parent component.
   */
  protected onSubmit(): void {
    if (this.isEditMode()) {
      this.updateCountry.emit(this.formData());
    } else {
      this.addCountry.emit(this.formData());
    }

    this.close();
  }

  /**
   * Computed signal that determines if the country form has all required fields filled and valid.
   */
  protected isFormValid: Signal<boolean> = computed((): boolean => {
    const data: CountryForm = this.formData();
    return data.countryName.trim() !== '' && data.countryCode !== '';
  });

}
