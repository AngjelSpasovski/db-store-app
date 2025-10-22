// src/app/user/billing/local-billing.api.ts
import { Injectable } from '@angular/core';
import { BillingApi, BillingRow, BillingStatus } from './billing.api'; // 👈 внимавај на патеката
import { Observable, of } from 'rxjs';
import { BillingService } from '../user/billing/billing.service';

@Injectable({ providedIn: 'root' })
export class LocalBillingApi extends BillingApi {
  constructor(private billing: BillingService) { super(); }

  private toStatus(credits: number): BillingStatus {
    return credits > 0 ? 'SUCCESS' : 'FAILED';
  }

  listMyPayments(): Observable<BillingRow[]> {
    const rows: BillingRow[] = this.billing.getAll().map((inv: { id: any; timestamp: string | number | Date; credits: number; amount: any; }) => ({
      id: inv.id,
      timestamp: new Date(inv.timestamp).toISOString(),
      credits: inv.credits,
      amount: inv.amount,
      status: this.toStatus(inv.credits),   // ✅ точно типизиран BillingStatus
      receiptUrl: undefined,
    }));
    return of(rows);                         // ✅ Observable<BillingRow[]>
  }
}
