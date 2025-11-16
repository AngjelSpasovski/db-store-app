// src/app/shared/local-credits.api.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CreditsApi } from './credits.api';

@Injectable({ providedIn: 'root' })
export class LocalCreditsApi implements CreditsApi {
  private credits = 0;

  getMyCredits(): Observable<number> {
    return of(this.credits);
  }

  setCredits(value: number): void {
    this.credits = Math.max(0, value);
  }
}
