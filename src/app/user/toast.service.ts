// toast.service.ts
import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private renderer: Renderer2;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    // create a renderer at the root level
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Displays a toast message.
   * @param message The message to display.
   * @param success Whether the toast is for success (green) or error (red).
   * @param duration How long the toast should be visible (default 4000ms).
   * @param position One of 'top-center' | 'top-end' | 'bottom-end' | etc.
   */
  show(
    message: string,
    success = true,
    duration = 4000,
    position: 'top-center' | 'top-end' | 'bottom-end' = 'bottom-end'
  ) {
    const container = this.document.getElementById('toast-container');
    if (!container) return;

    // position classes
    container.className = `toast-container position-fixed ${
      position === 'top-center'
        ? 'top-0 start-50 translate-middle-x'
        : position === 'top-end'
        ? 'top-0 end-0'
        : 'bottom-0 end-0'
    } p-3`;

    const toast = this.renderer.createElement('div');
    this.renderer.addClass(toast, 'toast');
    this.renderer.addClass(toast, 'align-items-center');
    this.renderer.addClass(toast, `text-bg-${success ? 'success' : 'danger'}`);
    this.renderer.addClass(toast, 'border-0');
    this.renderer.addClass(toast, 'show');
    this.renderer.setAttribute(toast, 'role', 'alert');
    this.renderer.setAttribute(toast, 'aria-live', 'assertive');
    this.renderer.setAttribute(toast, 'aria-atomic', 'true');

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button"
                class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"
                aria-label="Close"></button>
      </div>`;

    this.renderer.appendChild(container, toast);

    setTimeout(() => {
      this.renderer.removeChild(container, toast);
    }, duration);
  }
}
