import { Observable } from 'rxjs';
export type BillingStatus = 'SUCCESS'|'FAILED'|'PENDING';
export interface BillingRow {
  id: string;
  timestamp: string;   // ISO
  credits: number;
  amount: number;
  status: BillingStatus;
  receiptUrl?: string;
}
export abstract class BillingApi {
  abstract listMyPayments(): Observable<BillingRow[]>;
}
