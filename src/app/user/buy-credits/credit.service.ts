// src/app/user/buy-credits/credit.service.ts
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { CREDITS_API } from '../../shared/tokens.api';
import type { CreditsApi } from '../../shared/credits.api'; // 👈 ако го немаш овој файл, кажи, ќе го направиме

@Injectable({ providedIn: 'root' })
export class CreditsService {

  private readonly creditsSubject = new BehaviorSubject<number>(0);
  /** stream за сите компоненти (sidebar, buy-credits, итн.) */
  readonly credits$ = this.creditsSubject.asObservable();

  constructor(
    @Inject(CREDITS_API) private api: CreditsApi
  ) {}

  /** Се повикува после логин, после успешно плаќање, итн. */
  refreshFromApi(): void {
    this.api.getMyCredits().subscribe({
      next: (value) => {
        const n = typeof value === 'number' ? value : 0;
        this.creditsSubject.next(n);
      },
      error: (err) => {
        console.error('Failed to load credits from API', err);
        // по желба можеш да НЕ го ресетираш на 0, јас го оставам да не крашира
        this.creditsSubject.next(0);
      }
    });
  }

  /** snapshot ако ти треба моменталната вредност */
  get current(): number {
    return this.creditsSubject.value;
  }
}
