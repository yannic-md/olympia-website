import {
  Component,
  computed,
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
import {MiscService} from "../../../../services/misc/misc.service";
import {TranslatePipe} from "@ngx-translate/core";

interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-modal-register',
  imports: [
    FormsModule,
    NgOptimizedImage,
    TranslatePipe
  ],
  templateUrl: './modal-register.component.html',
  styleUrl: './modal-register.component.css'
})
export class ModalRegisterComponent {
  isOpen: InputSignal<boolean> = input.required<boolean>();
  closeModal: OutputEmitterRef<void> = output<void>();
  registerUser: OutputEmitterRef<RegisterForm> = output<RegisterForm>();

  protected formData: WritableSignal<RegisterForm> = signal(this.getEmptyForm());
  protected isClosing: WritableSignal<boolean> = signal(false);

  constructor(protected miscService: MiscService) {}

  /**
   * Returns an empty register form object with default values.
   */
  private getEmptyForm(): RegisterForm {
    return { username: '', password: '', confirmPassword: '' };
  }

  /**
   * Closes the modal, resets the form data to initial state, and emits the close event.
   */
  protected close(): void {
    this.isClosing.set(true);

    setTimeout((): void => {
      this.isClosing.set(false);
      this.formData.set(this.getEmptyForm());
      this.closeModal.emit();
    }, 200);
  }

  /**
   * Submits the registration form if valid, emits the form data, and closes the modal.
   */
  protected onSubmit(): void {
    if (this.isFormValid()) {
      this.registerUser.emit(this.formData());
      this.close();
    }
  }

  /**
   * Computed signal that determines if the register form has all required fields filled and valid.
   */
  protected isFormValid: Signal<boolean> = computed((): boolean => {
    const data: RegisterForm = this.formData();
    return data.username.trim().length >= 3 &&
      data.password.length >= 6 && data.password === data.confirmPassword;
  });

  /**
   * Checks if password and confirmation match, or if confirmation is still empty.
   */
  protected passwordsMatch: Signal<boolean> = computed((): boolean => {
    const data: RegisterForm = this.formData();
    return data.password === data.confirmPassword || data.confirmPassword === '';
  });
}
