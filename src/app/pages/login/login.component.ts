import {Component, Inject, PLATFORM_ID, signal, WritableSignal} from '@angular/core';
import {isPlatformBrowser, NgOptimizedImage} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {ModalRegisterComponent} from "../../layout/sections/modal/modal-register/modal-register.component";
import {FormsModule} from "@angular/forms";
import {MiscService} from "../../services/misc/misc.service";
import {AuthService} from "../../services/api/auth/auth.service";
import {HttpErrorResponse} from "@angular/common/http";
import {AlertService} from "../../services/api/alert/alert.service";
import {AlertBoxComponent} from "../../layout/sections/alert-box/alert-box.component";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";

interface LoginForm {
  username: string;
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
    FormsModule,
    AlertBoxComponent,
    TranslatePipe
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  protected loginData: WritableSignal<LoginForm> = signal({ username: '', password: '' });
  protected isRegisterModalOpen: WritableSignal<boolean> = signal(false);
  protected loginError: WritableSignal<string> = signal('');
  protected isLoading: WritableSignal<boolean> = signal(false);
  protected skipEntryAnimation: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router,
              protected miscService: MiscService, private authService: AuthService,
              private alertService: AlertService, private translateService: TranslateService) {
    if (isPlatformBrowser(this.platformId)) {
      // Don't replay the animation after an in-app route change – only on the initial page load.
      this.skipEntryAnimation = document.readyState === 'complete';
    }
  }

  /**
   * Handles the user login process and navigates to the home page on success.
   *
   * Validates the input, triggers the authentication request, shows a loading state, and displays a
   * translated error message if the credentials are invalid or the login fails.
   */
  protected onLogin(): void {
    const {username, password} = this.loginData();
    this.loginError.set('');

    const allowCookies: string | null = localStorage.getItem('allow_cookies');
    if (!allowCookies || (allowCookies && allowCookies != 'true')) {
      this.loginError.set(this.translateService.instant('PAGE.LOGIN.ERROR.COOKIES'));
      return;
    }

    if (!username.trim() || !password) {
      this.loginError.set(this.translateService.instant('PAGE.LOGIN.ERROR.INCOMPLETE'));
      return;
    }

    this.isLoading.set(true);
    this.authService.login(username, password).subscribe({
      next: (): void => {
        this.router.navigate(['/']).then(_r => {
          this.alertService.success(
            (this.translateService.instant('ALERT.LOGIN')).replace('[name]', this.authService.currentUser()?.username));
        });
      },
      error: (_err: HttpErrorResponse): void => {
        this.isLoading.set(false);
        this.loginError.set(this.translateService.instant('ALERT.LOGIN.ERROR'));
      }
    });
  }

  /**
   * Opens the registration modal after performing cookie-consent validation.
   */
  protected onRegisterModalOpen(): void {
    this.loginError.set('');

    const allowCookies: string | null = localStorage.getItem('allow_cookies');
    if (!allowCookies || (allowCookies && allowCookies != 'true')) {
      this.alertService.error(this.translateService.instant('PAGE.LOGIN.ERROR.COOKIES'));
      return;
    }

    this.isRegisterModalOpen.set(true);
  }

  /**
   * Handles user registration and redirects to the home page on success.
   *
   * Clears previous errors, shows a loading state, calls the registration API and, on success, navigates to the
   * root route while on failure setting a user-friendly, conflict-aware error message.
   *
   * @param {RegisterForm} data The registration form data containing username, password and confirmation.
   */
  protected onRegister(data: RegisterForm): void {
    this.loginError.set('');
    this.isLoading.set(true);

    this.authService.register(data.username, data.password).subscribe({
      next: (): void => {
        this.router.navigate(['/']).then(_r => {
          this.alertService.success(
            (this.translateService.instant('ALERT.LOGIN')).replace('[name]', this.authService.currentUser()?.username));
        });
      },
      error: (err: HttpErrorResponse): void => {
        this.isLoading.set(false);
        const isConflict: boolean = err.status === 409 || err.error?.message?.includes('exists');
        this.alertService.error(isConflict ? (this.translateService.instant('ALERT.REGISTER.ERROR.CONFLICT'))
                                           : (this.translateService.instant('ALERT.REGISTER.ERROR'))
        );
      }
    });
  }
}
