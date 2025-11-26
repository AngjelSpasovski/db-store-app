// src/app/shared/local-billing.api.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BillingApi, BillingRow, BillingStatus } from './billing.api';

interface LocalPayment {
  id: number;
  timestamp: string | number | Date;
  credits: number;
  amount: number;
  status: BillingStatus;
  stripeSessionId?: string;
  receiptUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LocalBillingApi implements BillingApi {

  /** mock storage во memory */
  private storage: LocalPayment[] = [
    // тука можеш да ставиш пример записи ако сакаш
    // {
    //   id: 1,
    //   timestamp: new Date(),
    //   credits: 100,
    //   amount: 100,
    //   status: 'SUCCESS',
    //   stripeSessionId: 'sess_123',
    //   receiptUrl: null
    // }
  ];

  listMyPayments(): Observable<BillingRow[]> {
    const rows: BillingRow[] = this.storage.map(p => {
      const ts = new Date(p.timestamp).toISOString();
      return {
        id: p.id,
        timestamp: ts,
        createdAt: ts,
        credits: p.credits,
        amount: p.amount,
        status: p.status,
        stripeSessionId: p.stripeSessionId ?? '',
        receiptUrl: p.receiptUrl ?? null,
      };
    });

    return of(rows);
  }
}
