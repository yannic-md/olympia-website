import { HttpRequest, HttpResponse } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('should forward a cloned request with withCredentials set to true for /api URLs', async () => {
	const request = new HttpRequest('GET', '/api/countries', null, { withCredentials: false });
	const cloneSpy = jest.spyOn(request, 'clone');

	let forwardedRequest: HttpRequest<unknown> | undefined;
	const next = (req: HttpRequest<unknown>) => {
	  forwardedRequest = req;
	  return of(new HttpResponse({ status: 200 }));
	};

	await firstValueFrom(authInterceptor(request, next));

	expect(cloneSpy).toHaveBeenCalledWith({ withCredentials: true });
	expect(forwardedRequest).toBeDefined();
	expect(forwardedRequest).not.toBe(request);
	expect(forwardedRequest?.withCredentials).toBe(true);
  });

  it('should forward the original request unchanged for non-/api URLs', async () => {
	const request = new HttpRequest('GET', '/assets/i18n/en.json');

	let forwardedRequest: HttpRequest<unknown> | undefined;
	const next = (req: HttpRequest<unknown>) => {
	  forwardedRequest = req;
	  return of(new HttpResponse({ status: 200 }));
	};

	await firstValueFrom(authInterceptor(request, next));

	expect(forwardedRequest).toBe(request);
	expect(forwardedRequest?.withCredentials).toBe(false);
  });
});

