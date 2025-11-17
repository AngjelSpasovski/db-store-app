// src/app/shared/tokens.api.ts
import { InjectionToken } from '@angular/core';
import { CreditsApi } from './credits.api';
import { BillingApi } from './billing.api';

export const CREDITS_API = new InjectionToken<CreditsApi>('CREDITS_API');
export const BILLING_API = new InjectionToken<BillingApi>('BILLING_API');
