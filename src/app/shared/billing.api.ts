// src/app/shared/billing.api.ts
import { Observable } from 'rxjs';

export type BillingStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'PAID';

export interface BillingRow {
  id: number;
  timestamp: string;

  credits:  number;
  amount:   number;
  status:   BillingStatus;

  stripeSessionId:  string;
  createdAt:        string;

  // 🔽 package info (од Invoice)
  packageName?:               string;
  packageCredits?:            number;
  packagePrice?:              number;
  packageDiscountPercentage?: number | string;
  packageIsActive?:           boolean;
  packageCreatedAt?:          string;
  packageUpdatedAt?:          string;

  // 🔽 за frontend
  receiptUrl?:                string | null;
}


export abstract class BillingApi {
  abstract listMyPayments(): Observable<BillingRow[]>;
}

