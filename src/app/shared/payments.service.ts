// src/app/shared/payments.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import type { CreditPackage } from '../user/buy-credits/credit-packages.config';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');
  constructor(private http: HttpClient, private toast: ToastService) {}

  async start(pkg: CreditPackage): Promise<void> {
    if (environment.paymentsMode === 'paymentLinks') {
      if (!pkg.paymentLinkUrl) {
        this.toast.info('This package will be available soon.');
        return;
      }
      window.location.href = pkg.paymentLinkUrl;
      return;
    }

    // API mode → Checkout Session
    try {
      const res = await this.http
        .post<{ url: string }>(`${this.base}/checkout/session`, {
          priceId: pkg.priceId,
          credits: pkg.credits,
        })
        .toPromise();

      if (!res?.url) {
        this.toast.error('Unable to start checkout. Please try again.');
        return;
      }
      window.location.href = res.url;
    } catch (err) {
      console.error(err);
      this.toast.error('Payment init failed. Please try again.');
    }
  }
}
