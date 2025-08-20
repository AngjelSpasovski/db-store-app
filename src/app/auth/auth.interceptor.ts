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
  private loggingOut = false; // (2)

  constructor(private toast: ToastService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const base = (environment.baseApiUrl || '').replace(/\/+$/, '');
    const isAsset = /\/(assets|i18n)\//.test(req.url);
    const isAuth  = req.url.startsWith(`${base}/auth/`);

    // (1) restrict API calls to our base URL
    const isApiCall =
      req.url.startsWith(base) ||                // our full base URL
      (base.startsWith('/')
        ? req.url.startsWith(base)               // real base URL with leading slash
        : false);

    const token  = localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token');
    const addAuth = !!token && isApiCall && !isAsset && !isAuth;

    const finalReq = addAuth
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(finalReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // (4) if you are not on an auth screen, show error toast
        const currentlyOnAuthScreen = this.router.url.startsWith('/login')
          || this.router.url.startsWith('/forgot-password')
          || this.router.url.startsWith('/reset-password');

        if (!isAuth && !currentlyOnAuthScreen) {
          this.toast.show(this.prettyError(err), false, 6000, 'top-end');
        }

        // (2) logout/redirect if unauthorized
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
  
  // (3) pretty error messages
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
    if (err.status === 422 && err.error?.errors) {
      return this.flatten(err.error.errors).join(' • ');
    }
    if (err.status === 429) return 'Too many requests. Please try again later.';
    if (err.status >= 500)  return 'Server error. Please try again later.';

    return err.error?.message || `Error ${err.status || ''}`.trim();
  }

  // (3) Flatten nested error objects into a simple array of strings
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

