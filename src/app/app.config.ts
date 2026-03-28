import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideClientHydration, withNoHttpTransferCache} from '@angular/platform-browser';
import {provideHttpClient, withFetch, withInterceptors} from "@angular/common/http";
import {authInterceptor} from "./interceptors/auth.interceptor";
import {provideTranslateService} from "@ngx-translate/core";
import {provideTranslateHttpLoader} from "@ngx-translate/http-loader";

/** Resolves the correct locale synchronously before the app starts. */
function resolveInitialLang(): string {
  if (typeof localStorage !== 'undefined') {
    switch (localStorage.getItem('lang')) {
      case 'French':  return 'fr';
      case 'English': return 'en';
      case 'German':  return 'de';
    }
  }

  // Fall back to browser language
  const browserLang = (navigator?.language ?? 'de').split('-')[0];
  return ['de', 'en', 'fr'].includes(browserLang) ? browserLang : 'de';
}

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration(withNoHttpTransferCache()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'de',
      lang: resolveInitialLang()
    })]
};
