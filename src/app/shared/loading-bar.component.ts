// src/app/shared/loading-bar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingBarService } from './loading-bar.service';

@Component({
  standalone: true,
  selector: 'app-loading-bar',
  imports: [CommonModule],
  styles: [`
    .loading-bar-wrap {
      position: fixed; top: 60px; left: 0; right: 0; height: 3px; z-index: 1300;
      pointer-events: none;
    }
    .loading-bar {
      height: 100%; width: 100%;
      transform-origin: 0 0;
      animation: indet 1.2s infinite linear;
      background: linear-gradient(90deg, rgba(0,0,0,0) 0%, #0d6efd 50%, rgba(0,0,0,0) 100%);
      opacity: .9;
    }
    @keyframes indet {
      0%   { transform: translateX(-100%) scaleX(0.4); }
      50%  { transform: translateX(0%)     scaleX(1.0); }
      100% { transform: translateX(100%)   scaleX(0.4); }
    }
  `],
  template: `
    <div class="loading-bar-wrap" *ngIf="loader.isLoading$ | async">
      <div class="loading-bar"></div>
    </div>
  `
})
export class LoadingBarComponent {
  constructor(public loader: LoadingBarService) {}
}
