// src/app/user/buy-credits/credit.service.ts
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CREDITS_API } from '../../shared/tokens.api';
import { CreditsApi } from '../../shared/credits.api';

@Injectable({ providedIn: 'root' })
export class CreditsService {
  private creditsSubject = new BehaviorSubject<number>(0);
  credits$ = this.creditsSubject.asObservable();

  constructor(
    @Inject(CREDITS_API) private api: CreditsApi
  ) {}

  refreshFromApi() {
    this.api.getMyCredits().subscribe({
      next: (v) => this.creditsSubject.next(v),
      error: (err) => {
        console.error('Failed to load credits', err);
        // optionally: keep last value
      },
    });
  }

  /** Опционално ако сакаш рачно да сетираш вредност */
  setCredits(v: number) {
    this.creditsSubject.next(Math.max(0, v));
  }
}
