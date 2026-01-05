// src/app/shared/api-error.util.ts
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

export type FieldErrors = Record<string, string[]>;

export class ApiErrorUtil {

  // Проверува дали грешката е HTTP 422 Unprocessable Entity
  static is422(err: any): boolean {
    return err instanceof HttpErrorResponse && err.status === 422;
  }

  // Извлекува field errors од API грешка
  static getFieldErrors(err: any): FieldErrors | null {
    const e = err?.error?.errors;
    if (!e || typeof e !== 'object') return null;

    const out: FieldErrors = {};
    for (const [k, v] of Object.entries(e)) {
      if (Array.isArray(v)) out[k] = v.map(String);
      else if (v && typeof v === 'object') out[k] = ApiErrorUtil.flattenToArray(v);
      else if (v != null) out[k] = [String(v)];
    }
    return out;
  }

  // Помошна функција за рафлетање на вредности во низa
  static flattenToArray(obj: any): string[] {
    const out: string[] = [];
    Object.values(obj || {}).forEach((v: any) => {
      if (Array.isArray(v)) out.push(...v.map(String));
      else if (v && typeof v === 'object') out.push(...ApiErrorUtil.flattenToArray(v));
      else if (v) out.push(String(v));
    });
    return out;
  }

  // Преведува API грешка во кориснички прифатлива порака
  static toMessage(err: any): string {
    if (!err) return 'Unknown error occurred. Please try again later.';
    if (typeof err === 'string') return err;
    
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

    if (err.status === 422) {
      const fe = ApiErrorUtil.getFieldErrors(err);
      if (fe) {
        const parts: string[] = [];

        for (const key of Object.keys(fe)) {
          const arr = fe[key] || [];
          for (const msg of arr) parts.push(`${key}: ${msg}`);
        }

        return parts.join(' • ');
      }

      return err.error?.message || 'Validation failed.';
    }

    if (err.status === 429) return 'Too many requests. Please try again later.';
    if (err.status >= 500)  return 'Server error. Please try again later.';
    return err.error?.message || `Error ${err.status || ''}`.trim();
  }

  // Аплицира API грешки на FormGroup контроли
  static applyToForm(form: FormGroup, err: any): boolean {
    const fe = ApiErrorUtil.getFieldErrors(err);
    if (!fe) return false;

    for (const key of Object.keys(fe)) {
      const msgs = fe[key] || [];
      const ctrl = form.get(key);
      if (!ctrl) continue;

      ctrl.setErrors({ ...(ctrl.errors || {}), api: msgs.join(' ') });
      ctrl.markAsTouched();
    }

    return true;
  }

  // Ја брише API грешката од FormGroup контролите
  static clearApiErrors(form: FormGroup): void {
    Object.keys(form.controls).forEach((k) => {
      const c = form.get(k);
      if (!c?.errors?.['api']) return;
      const { api, ...rest } = c.errors || {};
      c.setErrors(Object.keys(rest).length ? rest : null);
    });
  }
}
