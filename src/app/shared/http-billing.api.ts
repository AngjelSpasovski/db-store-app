// src/app/shared/http-billing.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { BillingApi, BillingRow, BillingStatus } from './billing.api';
import { environment } from 'src/environments/environment';

interface InvoiceLikeDto {
  id: number;
  credits?: number;
  amount: number;
  status: string;           // може да биде 'PAID', 'SUCCESS', 'FAILED', 'PENDING', ...
  createdAt: string;        // ISO date
  stripeSessionId: string;
  receiptUrl?: string | null;

  // понекогаш credits може да дојдат преку package
  package?: {
    credits?: number;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class HttpBillingApi implements BillingApi {
  private base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  /**
   * Billing history за тековен корисник.
   * Backend endpoint: GET /api/v1/users/me/invoices  →  { list: [...] }
   */
  listMyPayments(): Observable<BillingRow[]> {
    return this.http
      .get<{ list: InvoiceLikeDto[] }>(`${this.base}/users/me/invoices`)
      .pipe(
        map(res => (res.list ?? []).map((inv): BillingRow => {
          // 1) нормализиран статус
          const raw = (inv.status || '').toUpperCase();

          let status: BillingStatus;
          if (raw === 'PAID') {
            // PAID го третираме како SUCCESS во grid-от
            status = 'SUCCESS';
          } else if (raw === 'SUCCESS' || raw === 'FAILED' || raw === 'PENDING' || raw === 'PAID') {
            status = raw as BillingStatus;
          } else {
            // fallback – ако backend врати нешто неочекувано
            status = 'FAILED';
          }

          // 2) кредити – или директно од DTO, или од package
          const credits =
            typeof inv.credits === 'number'
              ? inv.credits
              : (inv.package?.credits ?? 0);

          return {
            id: inv.id,
            timestamp: inv.createdAt,
            createdAt: inv.createdAt,
            credits,
            amount: inv.amount,
            status,
            stripeSessionId: inv.stripeSessionId,
            receiptUrl: inv.receiptUrl ?? null,
          };
        }))
      );
  }
}
