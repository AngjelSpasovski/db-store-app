// src/app/auth/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from './auth.environment';
import { ToastService } from '../shared/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private loggingOut = false;

  constructor(
    private toast: ToastService,
    private router: Router,
    private i18n: TranslateService,
    private auth: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const origin = window.location.origin; // 'http://localhost:4200'
    const token  = this.auth.token;

    // baseApiUrl: '/api/v1' или 'https://.../api/v1'
    const base   = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');
    // apiRoot: '/api' или 'https://.../api'
    const apiRoot = base.replace(/\/v1$/, '');

      // ⬇️ Stripe специјални ендпоинти
      const isStripeCheckout = req.url.includes('/stripe/checkout/create') || req.url.includes('/stripe/webhook'); // ако некогаш го викаш и од фронт

    // апсолутна база до API
    const absBase     = base.startsWith('http')    ? base    : `${origin}${base}`;
    const absApiRoot  = apiRoot.startsWith('http') ? apiRoot : `${origin}${apiRoot}`;
    const absUrl      = req.url.startsWith('http') ? req.url : `${origin}${req.url}`;

    // asset-и (i18n + статички)
    const isAsset = /\/(assets|i18n)\//.test(req.url);

    // дали е API повик:
    //  - '/api/v1/...'
    //  - '/api/...'
    const isApi = !!base && (absUrl.startsWith(absBase) || absUrl.startsWith(absApiRoot));

    // дали е auth endpoint (sign-in, sign-up, reset итн.)
    const isAuth = (!!base && (absUrl.startsWith(`${absBase}/auth/`) || absUrl.startsWith(`${absApiRoot}/auth/`)));

    const addAuth = !!token && isApi && !isAsset && !isAuth;

    let finalReq = req;

    if (!isAsset) {
      const lang = (this.i18n.currentLang || this.i18n.getDefaultLang() || 'en').toLowerCase();
      const headers: Record<string, string> = {
        'Accept-Language': lang,
      };
      if (addAuth) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      finalReq = req.clone({ setHeaders: headers });
    }

    // debug logging
    console.debug('[HTTP]', finalReq.method, finalReq.url, { authed: !!finalReq.headers.get('Authorization') });

    return next.handle(finalReq).pipe(
      catchError((err: HttpErrorResponse) => {
        const onAuthScreen =
          this.router.url.startsWith('/login') ||
          this.router.url.startsWith('/forgot-password') ||
          this.router.url.startsWith('/reset-password');

        const heavyError = [0, 500, 502, 503, 504].includes(err.status) || err.status >= 500;

        const willLogout = err.status === 401 && addAuth;

        if (!isAuth && !isStripeCheckout && (!onAuthScreen || heavyError) && !willLogout) {
          this.toast.error(this.prettyError(err), {
            position: 'top-end',
            duration: 6000,
          });
        }

        // 401 → logout само ако сме праќале токен (addAuth == true)
        if (err.status === 401 && addAuth && !this.loggingOut) {
          this.loggingOut = true;

          // најчисто: едно место што чисти token+user и ги сетира subject-ите
          this.auth.logout();

          // logout() веќе navigate-ира; само reset на флагот
          queueMicrotask(() => (this.loggingOut = false));
        }


        return throwError(() => err);
      })
    );
  }

  private prettyError(err: HttpErrorResponse): string {
    if (!err || !err.status) return 'Unknown error occurred. Please try again later.';
    if (err.status === 0)   return 'Network error: API not reachable.';
    if (err.status === 400) return err.error?.message || 'Bad request.';
    if (err.status === 401) return 'Session expired. Please sign in again.';
    if (err.status === 403) {
      const m = (err.error?.message || '').toLowerCase();
      return m.includes('not verified')
        ? 'Email not verified. Check your inbox.'
        : (err.error?.message || 'Forbidden');
    }
    if (err.status === 404) return 'Resource not found.';
    if (err.status === 408) return 'Request timeout. Please try again.';
    if (err.status === 413) return 'Payload too large.';
    if (err.status === 422 && err.error?.errors) return this.flatten(err.error.errors).join(' • ');
    if (err.status === 429) return 'Too many requests. Please try again later.';
    if (err.status === 502) return 'Upstream server error. Please try again.';
    if (err.status === 503) return 'Service temporarily unavailable. Please try again soon.';
    if (err.status === 504) return 'Server timeout. Please try again.';
    if (err.status >= 500)  return 'Server error. Please try again later.';
    return err.error?.message || `Error ${err.status || ''}`.trim();
  }

  private flatten(obj: any): string[] {
    const out: string[] = [];
    Object.values(obj || {}).forEach((v: any) => {
      if (Array.isArray(v)) out.push(...v.map(String));
      else if (v && typeof v === 'object') out.push(...this.flatten(v));
      else if (v) out.push(String(v));
    });
    return out;
  }
}
