// src/app/shared/tokens.api.ts
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { BillingApi } from './billing.api';

export interface CreditsApi {
  getMyCredits(): Observable<number>;
  // ако подоцна додадеме уште методи, ги ставаме тука
}

export const CREDITS_API = new InjectionToken<CreditsApi>('CREDITS_API');
export const BILLING_API = new InjectionToken<BillingApi>('BILLING_API');
