import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthService} from "../services/api/auth/auth.service";

/**
 * Intercepts outgoing HTTP requests and conditionally adds an Authorization header.
 * Skips authentication for auth-related endpoints and public API calls while attaching a Basic Auth header
 * for protected API routes that require authentication.
 *
 * @param req The outgoing HTTP request to be intercepted.
 * @param next The HTTP handler that forwards the request to the next interceptor or backend.
 * @returns An observable of the HTTP event stream with the potentially modified request.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // user wants to log-in/register; don't add headers
  if (req.url.includes('/api/auth')) {
    return next(req);
  }

  // user wants to make something he needs a login for (like editing athletes or countries)
  const authHeader: string | null = inject(AuthService).getBasicAuthHeader();
  if (authHeader && req.url.startsWith('/api') && !req.url.includes("/public")) {
    return next(req.clone({setHeaders: {Authorization: authHeader}}));
  }

  return next(req);
};
