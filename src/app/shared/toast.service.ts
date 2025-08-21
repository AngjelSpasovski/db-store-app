// src/app/shared/toast.service.ts
import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ToastKind = 'success' | 'info' | 'warning' | 'error';
export type ToastPos  = 'top-center' | 'top-end' | 'bottom-end';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private r: Renderer2;
  private lastMsg = ''; private lastAt = 0;

  constructor(rf: RendererFactory2, @Inject(DOCUMENT) private doc: Document) {
    this.r = rf.createRenderer(null, null);
  }

  success(m: string, o: Partial<Opts> = {}) { this._show(m, { ...o, kind: 'success' }); }
  info(   m: string, o: Partial<Opts> = {}) { this._show(m, { ...o, kind: 'info'    }); }
  warn(   m: string, o: Partial<Opts> = {}) { this._show(m, { ...o, kind: 'warning' }); }
  error(  m: string, o: Partial<Opts> = {}) { this._show(m, { ...o, kind: 'error'   }); }

  show(m: string, success = true, duration = 4000, position: ToastPos = 'bottom-end') {
    this._show(m, { duration, position, kind: success ? 'success' : 'error' });
  }

  private _show(
    message: string,
    opts: Partial<Opts> = {}
  ) {
    // дефолти на едно место
    const {
      duration = 4000,
      position = 'bottom-end',
      kind = 'success',
      dedupeMs = 1200,
    } = opts;

    const now = Date.now();
    if (message === this.lastMsg && (now - this.lastAt) < dedupeMs) return;
    this.lastMsg = message; this.lastAt = now;

    const container = this.doc.getElementById('toast-container');
    if (!container) return;

    container.className = `toast-container position-fixed ${position === 'top-center' ? 'top-0 start-50 translate-middle-x' : position === 'top-end' ? 'top-0 end-0' : 'bottom-0 end-0' } p-3`;

    const toast = this.r.createElement('div');
    this.r.addClass(toast, 'toast');
    this.r.addClass(toast, 'align-items-center');
    this.r.addClass(toast, 'border-0');
    this.r.addClass(toast, 'show');

    const bg =
      kind === 'success' ? 'text-bg-success' :
        kind === 'info' ? 'text-bg-info' :
          kind === 'warning' ? 'text-bg-warning' : 'text-bg-danger';

    this.r.addClass(toast, bg);
    this.r.setAttribute(toast, 'role', 'alert');
    this.r.setAttribute(toast, 'aria-live', 'assertive');
    this.r.setAttribute(toast, 'aria-atomic', 'true');

    toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close me-2 m-auto" aria-label="Close"></button>
    </div>`;

    const btn = toast.querySelector('button');
    btn?.addEventListener('click', () => this.r.removeChild(container, toast));

    this.r.appendChild(container, toast);
    setTimeout(() => this.r.removeChild(container, toast), duration);
  }
}

interface Opts {
  duration: number;
  position: ToastPos;
  kind: ToastKind;
  dedupeMs: number;
}
