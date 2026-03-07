import {HttpInterceptorFn} from '@angular/common/http';

/**
 * Intercepts outgoing HTTP requests and adds `withCredentials: true` so the browser
 * automatically forwards the session cookie to the backend on every API call.
 *
 * @param req The outgoing HTTP request to be intercepted.
 * @param next The HTTP handler that forwards the request to the next interceptor or backend.
 * @returns An observable of the HTTP event stream with the potentially modified request.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Forward credentials (session cookie) for all API requests
  if (req.url.includes('/api')) {
    return next(req.clone({withCredentials: true}));
  }
  return next(req);
};


