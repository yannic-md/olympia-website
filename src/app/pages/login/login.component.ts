import {Component, signal, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {ModalRegisterComponent} from "../../layout/sections/modal/modal-register/modal-register.component";
import {FormsModule} from "@angular/forms";
import {MiscService} from "../../services/misc.service";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-login',
  imports: [
    NgOptimizedImage,
    RouterLink,
    ModalRegisterComponent,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  protected loginData: WritableSignal<LoginForm> = signal({ email: '', password: '' });
  protected isRegisterModalOpen: WritableSignal<boolean> = signal(false);
  protected loginError: WritableSignal<string> = signal('');

  constructor(private router: Router, protected miscService: MiscService) {}

  /**
   * Validates if the provided string is a valid email address format.
   *
   * @param {string} email - The email address to validate.
   * @returns {boolean} True if the email format is valid, false otherwise.
   */
  private isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Submits the login form and redirects to the home page if login was a success.
   * TODO: real functionality
   */
  protected onLogin(): void {
    const { email, password } = this.loginData();
    this.loginError.set('');

    if (!email || !password) {
      this.loginError.set('Bitte fülle alle Felder aus.');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.loginError.set('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    console.log('Login attempt:', { email, password });
    this.router.navigate(['/']);
  }

  /**
   * Submits the register form and redirects to the home page if login was a success.
   * TODO: real functionality
   */
  protected onRegister(data: RegisterForm): void {
    console.log('Registration data:', data);
    this.loginError.set('');
    this.router.navigate(['/']).then();
  }
}
