// src/app/shared/toast.service.ts
import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ToastKind = 'success' | 'info' | 'warning' | 'error';
export type ToastPos  = 'top-center' | 'top-end' | 'bottom-end';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private r: Renderer2;
  private lastMsg = '';
  private lastAt  = 0;

  constructor(rf: RendererFactory2, @Inject(DOCUMENT) private doc: Document) {
    this.r = rf.createRenderer(null, null);
  }

  success(m: string, o: Partial<Opts> = {}) { this._show(m, { ...o, kind: 'success' }); }
  info   (m: string, o: Partial<Opts> = {}) { this._show(m, { ...o, kind: 'info'    }); }
  warn   (m: string, o: Partial<Opts> = {}) { this._show(m, { ...o, kind: 'warning' }); }
  error  (m: string, o: Partial<Opts> = {}) { this._show(m, { ...o, kind: 'error'   }); }

  // за старите повици
  show(m: string, success = true, duration = 4000, position: ToastPos = 'bottom-end') {
    this._show(m, { duration, position, kind: success ? 'success' : 'error' });
  }

  private _show(message: string, opts: Partial<Opts> = {}) {
    const { duration = 4000, position = 'bottom-end', kind = 'success', dedupeMs = 1200 } = opts;

    // de-dupe
    const now = Date.now();
    if (message === this.lastMsg && (now - this.lastAt) < dedupeMs) return;
    this.lastMsg = message; this.lastAt = now;

    const container = this.doc.getElementById('toast-container');
    if (!container) return;

    // позиција
    const posClass =
      position === 'top-center' ? 'top-0 start-50 translate-middle-x' :
      position === 'top-end'    ? 'top-0 end-0' :
                                  'bottom-0 end-0';
    container.className = `toast-container position-fixed ${posClass} p-3`;

    // toast shell
    const toast = this.r.createElement('div');
    this.r.addClass(toast, 'toast');
    this.r.addClass(toast, 'align-items-center');
    this.r.addClass(toast, 'border-0');
    this.r.addClass(toast, 'show');

    const bg =
      kind === 'success' ? 'text-bg-success' :
      kind === 'info'    ? 'text-bg-info'    :
      kind === 'warning' ? 'text-bg-warning' : 'text-bg-danger';
    this.r.addClass(toast, bg);
    this.r.setAttribute(toast, 'role', 'alert');
    this.r.setAttribute(toast, 'aria-live', 'assertive');
    this.r.setAttribute(toast, 'aria-atomic', 'true');

    // layout
    const wrap = this.r.createElement('div');
    this.r.addClass(wrap, 'd-flex');

    const body = this.r.createElement('div');
    this.r.addClass(body, 'toast-body');
    this.r.appendChild(body, this.r.createText(String(message ?? '')));

    const btn = this.r.createElement('button');
    this.r.setAttribute(btn, 'type', 'button');
    this.r.addClass(btn, 'btn-close');
    this.r.addClass(btn, 'btn-close-white');
    this.r.addClass(btn, 'me-2');
    this.r.addClass(btn, 'm-auto');
    this.r.setAttribute(btn, 'aria-label', 'Close');

    const un = this.r.listen(btn, 'click', () => {
      try { this.r.removeChild(container, toast); } catch {}
      un();
    });

    // assemble (еднаш)
    this.r.appendChild(wrap, body);
    this.r.appendChild(wrap, btn);
    this.r.appendChild(toast, wrap);
    this.r.appendChild(container, toast);

    // auto-hide (еднаш)
    setTimeout(() => {
      try { this.r.removeChild(container, toast); } catch {}
    }, duration);
  }

}

interface Opts {
  duration: number;
  position: ToastPos;
  kind: ToastKind;
  dedupeMs: number;
}
