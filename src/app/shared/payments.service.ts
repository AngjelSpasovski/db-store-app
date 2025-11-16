import { Injectable } from '@angular/core';
import { environment } from '../auth/auth.environment';
import { UserBillingApi } from './user-billing.api';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class PaymentsService {

  constructor(
    private userBilling: UserBillingApi,
    private toast: ToastService,
  ) {}

  /**
   * Започни плаќање за избраниот пакет.
   * - paymentLinks → redirect кон статички Stripe линк
   * - api          → повик кон /stripe/checkout/create и redirect кон checkoutUrl
   */
  start(opts: { packageId?: number; paymentLinkUrl?: string | null }): void {
    const { packageId, paymentLinkUrl } = opts;

    if (environment.paymentsMode === 'paymentLinks') {
      if (!paymentLinkUrl) {
        this.toast.error('Payment link is not configured for this package.');
        return;
      }
      window.location.href = paymentLinkUrl;
      return;
    }

    // API mode
    if (typeof packageId !== 'number') {
      console.error('Missing backend packageId for checkout');
      this.toast.error('Package is not properly configured.');
      return;
    }

    this.userBilling.createStripeCheckout(packageId).subscribe({
      next: (res) => {
        if (res?.checkoutUrl) {
          window.location.href = res.checkoutUrl;
        } else {
          this.toast.error('Payment URL was not returned from the server.');
        }
      },
      error: (err) => {
        console.error('Stripe checkout failed', err);

        const msg =
          err?.error?.message ||
          err?.message ||
          'Failed to start checkout. Please try again later.';

        this.toast.error(msg);
      },
    });
  }
}
