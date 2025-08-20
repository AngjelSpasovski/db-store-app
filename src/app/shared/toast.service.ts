// toast.service.ts
import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';
type ToastPos = 'top-center' | 'top-end' | 'bottom-end';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private renderer: Renderer2;
  private lastMsg = '';
  private lastAt = 0;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Show a toast.
   * @param message  Text to display
   * @param variantOrSuccess  Variant ('success' | 'error' | 'info' | 'warning') OR boolean for backward-compat
   * @param duration ms visible
   * @param position 'top-center' | 'top-end' | 'bottom-end'
   * @param dedupeMs suppress identical msg within this window
   */
  show(
    message: string,
    variantOrSuccess: ToastVariant | boolean = 'success',
    duration = 4000,
    position: ToastPos = 'bottom-end',
    dedupeMs = 1200
  ) {
    // dedupe
    const now = Date.now();
    if (message === this.lastMsg && (now - this.lastAt) < dedupeMs) return;
    this.lastMsg = message;
    this.lastAt = now;

    // container
    const container = this.document.getElementById('toast-container');
    if (!container) return;

    // normalize variant (keep backward-compat for boolean arg)
    const variant: ToastVariant =
      typeof variantOrSuccess === 'boolean'
        ? (variantOrSuccess ? 'success' : 'error')
        : variantOrSuccess;

    // map to Bootstrap contextual classes
    const bgClass =
      variant === 'success' ? 'text-bg-success' :
      variant === 'error'   ? 'text-bg-danger'  :
      variant === 'info'    ? 'text-bg-info'    :
                              'text-bg-warning';

    // close button contrast (info/warning have light bg → dark close; success/error → white close)
    const closeBtnClass = `btn-close${(variant === 'info' || variant === 'warning') ? '' : ' btn-close-white'}`;

    // ARIA politeness (errors/warnings = alert; others = status)
    const ariaRole = (variant === 'error' || variant === 'warning') ? 'alert' : 'status';

    // position
    container.className = `toast-container position-fixed ${
      position === 'top-center' ? 'top-0 start-50 translate-middle-x'
      : position === 'top-end'  ? 'top-0 end-0'
                                : 'bottom-0 end-0'
    } p-3`;

    // toast element
    const toast = this.renderer.createElement('div');
    this.renderer.addClass(toast, 'toast');
    this.renderer.addClass(toast, 'align-items-center');
    this.renderer.addClass(toast, bgClass);
    this.renderer.addClass(toast, 'border-0');
    this.renderer.addClass(toast, 'show');
    this.renderer.setAttribute(toast, 'role', ariaRole);
    this.renderer.setAttribute(toast, 'aria-live', 'polite');
    this.renderer.setAttribute(toast, 'aria-atomic', 'true');

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button"
                class="${closeBtnClass} me-2 m-auto"
                data-bs-dismiss="toast"
                aria-label="Close"></button>
      </div>`;

    this.renderer.appendChild(container, toast);

    // auto-remove
    setTimeout(() => {
      if (toast.parentNode === container) {
        this.renderer.removeChild(container, toast);
      }
    }, duration);
  }

  // Convenience helpers (optional)
  success(  msg: string, ms = 3000, pos: ToastPos = 'top-end')    { this.show(msg, 'success', ms, pos); }
  error(    msg: string, ms = 5000, pos: ToastPos = 'top-end')    { this.show(msg, 'error',   ms, pos); }
  info(     msg: string, ms = 4000, pos: ToastPos = 'top-end')    { this.show(msg, 'info',    ms, pos); }
  warn(     msg: string, ms = 4500, pos: ToastPos = 'top-end')    { this.show(msg, 'warning', ms, pos); }
}
