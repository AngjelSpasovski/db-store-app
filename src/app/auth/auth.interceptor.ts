// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from './auth.environment';
import { ToastService } from '../shared/toast.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private loggingOut = false;

  constructor(private toast: ToastService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const base  = (environment.baseApiUrl || '').replace(/\/+$/, '');  // normalize
    const token = localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token');

    const isAsset = /\/(assets|i18n)\//.test(req.url);
    const isAuth  = base && req.url.startsWith(`${base}/auth/`);

    // robust API call check (works for absolute and relative bases, e.g. '/api')
    const isApi =
      !!base && (
        req.url.startsWith(base) ||
        (base.startsWith('/') && req.url.startsWith(base))
      );

    const addAuth = !!token && isApi && !isAsset && !isAuth;

    const finalReq = addAuth
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(finalReq).pipe(
      catchError((err: HttpErrorResponse) => {
        const onAuthScreen =
          this.router.url.startsWith('/login') ||
          this.router.url.startsWith('/forgot-password') ||
          this.router.url.startsWith('/reset-password');

        // 🔸 HEAVY errors => toast и на auth екрани
        const heavyError = [0, 500, 502, 503, 504].includes(err.status) || err.status >= 500;

        // покажи toast ако не е auth-рута ИЛИ ако е heavy error
        if (!isAuth && (!onAuthScreen || heavyError)) {
          this.toast.show(this.prettyError(err), false, 6000, 'top-end');
        }

        // 401 на заштитени рути → исчисти токен и пренасочи
        if (err.status === 401 && addAuth && !this.loggingOut) {
          this.loggingOut = true;
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          this.router.navigate(['/login'], { queryParams: { tab: 'login' } })
            .finally(() => (this.loggingOut = false));
        }

        return throwError(() => err);
      })
    );
  }

  private prettyError(err: HttpErrorResponse): string {
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
    if (err.status === 422 && err.error?.errors) return this.flatten(err.error.errors).join(' • ');
    if (err.status === 429) return 'Too many requests. Please try again later.';
    // попрецизни 5xx
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
