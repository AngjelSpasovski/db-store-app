// src/app/shared/toast.service.ts
import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

type ToastType = 'success' | 'error' | 'info' | 'warning';
type ToastPos  = 'top-center' | 'top-end' | 'bottom-end';

interface ToastOpts {
  duration?: number;
  position?: ToastPos;
  dedupeMs?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private renderer: Renderer2;
  private lastMsg = '';
  private lastAt  = 0;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    private t: TranslateService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /** NEW: кратенки */
  success(message: string, opts: ToastOpts = {}) { this.show(message, 'success', opts); }
  error  (message: string, opts: ToastOpts = {}) { this.show(message, 'error',   opts); }
  info   (message: string, opts: ToastOpts = {}) { this.show(message, 'info',    opts); }
  warn   (message: string, opts: ToastOpts = {}) { this.show(message, 'warning', opts); }

  /** NEW: i18n helper (ќе преведе key со params) */
  showI18n(key: string, params?: Record<string, any>, type: ToastType = 'info', opts: ToastOpts = {}) {
    const msg = this.t.instant(key, params);
    this.show(msg, type, opts);
  }

  /**
   * MAIN: стандарден API (со backward-compat)
   * show(message, 'success'|'error'|'info'|'warning', {duration, position, dedupeMs})
   */
  show(
    message: string,
    typeOrSuccess: ToastType | boolean = 'success',
    optsOrDuration: ToastOpts | number = {},
    positionLegacy?: ToastPos,
    dedupeMsLegacy?: number
  ) {
    // --- Backward compat shim ---
    let type: ToastType;
    let opts: ToastOpts;

    if (typeof typeOrSuccess === 'boolean') {
      type = typeOrSuccess ? 'success' : 'error';
      if (typeof optsOrDuration === 'number') {
        opts = { duration: optsOrDuration, position: positionLegacy, dedupeMs: dedupeMsLegacy };
      } else {
        opts = optsOrDuration;
      }
    } else {
      type = typeOrSuccess;
      opts = (typeof optsOrDuration === 'number') ? { duration: optsOrDuration } : optsOrDuration;
    }
    const duration = opts?.duration ?? 4000;
    const position = opts?.position ?? 'bottom-end';
    const dedupeMs = opts?.dedupeMs ?? 1200;

    // de-dupe
    const now = Date.now();
    const sameAsLast = message === this.lastMsg && (now - this.lastAt) < dedupeMs;
    if (sameAsLast) return;
    this.lastMsg = message;
    this.lastAt  = now;

    const container = this.document.getElementById('toast-container');
    if (!container) return;

    // позиција
    container.className = `toast-container position-fixed ${
      position === 'top-center' ? 'top-0 start-50 translate-middle-x'
      : position === 'top-end'  ? 'top-0 end-0'
      :                           'bottom-0 end-0'
    } p-3`;

    // Bootstrap контекстуални бои
    const bgClass = {
      success: 'text-bg-success',
      error:   'text-bg-danger',
      info:    'text-bg-info',
      warning: 'text-bg-warning'
    }[type];

    // (опц.) мал иконичен префикс
    const icon = {
      success: '✓',
      error:   '✕',
      info:    'ℹ',
      warning: '⚠'
    }[type];

    const toast = this.renderer.createElement('div');
    this.renderer.addClass(toast, 'toast');
    this.renderer.addClass(toast, 'align-items-center');
    this.renderer.addClass(toast, bgClass);
    this.renderer.addClass(toast, 'border-0');
    this.renderer.addClass(toast, 'show');
    this.renderer.setAttribute(toast, 'role', 'alert');
    this.renderer.setAttribute(toast, 'aria-live', 'assertive');
    this.renderer.setAttribute(toast, 'aria-atomic', 'true');

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <span class="me-2" aria-hidden="true">${icon}</span>${message}
        </div>
        <button type="button"
                class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-2 m-auto"
                data-bs-dismiss="toast"
                aria-label="Close"></button>
      </div>
    `;

    this.renderer.appendChild(container, toast);
    setTimeout(() => this.renderer.removeChild(container, toast), duration);
  }
}
