import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class CreditsService {
  private readonly keyPrefix = 'credits_';
  private creditsSubject = new BehaviorSubject<number>(0);
  credits$ = this.creditsSubject.asObservable();

  constructor(private auth: AuthService) {
    const email = this.auth.getCurrentUser()?.email;
    if (email) {
      const stored = sessionStorage.getItem(this.keyPrefix + email);
      this.creditsSubject.next(stored ? +stored : 0);
    }
  }

  /** Додава кредити и ги памети во sessionStorage */
  addCredits(amount: number) {
    const email = this.auth.getCurrentUser()?.email;
    if (!email) return;

    const key = this.keyPrefix + email;
    const newTotal = this.creditsSubject.value + amount;
    sessionStorage.setItem(key, newTotal.toString());
    this.creditsSubject.next(newTotal);
  }
}
