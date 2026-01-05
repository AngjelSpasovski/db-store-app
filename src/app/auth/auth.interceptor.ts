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
import { ApiErrorUtil } from '../shared/api-error.util';

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
        //debugger;
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
        const isValidation = err.status === 422;

        // при грешки, покажи toast освен ако:
        // - е валидациска грешка (422)
        // - е auth ендпоинт (на пр. лош пасворд на логин)
        if (!isValidation && !isAuth && !isStripeCheckout && (!onAuthScreen || heavyError) && !willLogout) {
          this.toast.error(ApiErrorUtil.toMessage(err), { position: 'top-end', duration: 6000 });
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

}
