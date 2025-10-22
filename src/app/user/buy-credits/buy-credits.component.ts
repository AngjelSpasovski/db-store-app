// src/app/user/buy-credits/buy-credits.component.ts
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../shared/toast.service';

import { AuthService, AuthUser } from '../../auth/auth.service';
import { PaymentsService } from '../../shared/payments.service';
import { CREDIT_PACKAGES, CreditPackage } from './credit-packages.config';

import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-buy-credits',
  standalone: true,
  templateUrl: './buy-credits.component.html',
  styleUrls: ['./buy-credits.component.scss'],
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyCreditsComponent implements OnInit {
  public currentUser: AuthUser | null = null;
  public currentCredits = 0;

  // ✅ единствен извор на пакети
  public packages = CREDIT_PACKAGES;
  public loadingId: string | null = null;

  public environment = environment;

  constructor(
    private auth: AuthService,
    private payments: PaymentsService,
    private toast: ToastService,
  ) {}

  public ngOnInit(): void {
    // optional cancel feedback
    const qp = new URLSearchParams(window.location.search);
    if (qp.get('canceled') === '1') {
      this.toast.show('Payment canceled.', false, 3500, 'top-end');
      this.toast.info('Payment canceled.', { position: 'top-end' });

      // исчисти го query-string
      history.replaceState({}, '', window.location.pathname);
    }

    this.currentUser = this.auth.getCurrentUser();
    if (this.currentUser) {
      const storageKey = `credits_${this.currentUser.email}`;
      const stored = sessionStorage.getItem(storageKey);
      this.currentCredits = stored ? +stored : 0;
      if (!stored) sessionStorage.setItem(storageKey, '0');
    }
  }

  public trackByPkg = (_: number, pkg: CreditPackage) => pkg.id;

  public canBuy(pkg: CreditPackage): boolean {
    if (environment.paymentsMode === 'paymentLinks') {
      return !!pkg.paymentLinkUrl;
    }
    // 'api' mode
    return !!pkg.priceId;
  }

  async purchase(pkg: CreditPackage) {
    if (this.loadingId || !this.canBuy(pkg)) return;

    this.loadingId = pkg.id;
    try {
      await this.payments.start(pkg); // redirect или no-op ако нема линк
      // ако нема линк, start() ќе заврши без redirect → падни во else
      if (environment.paymentsMode === 'paymentLinks' && !pkg.paymentLinkUrl) {
        // покажи фина инфо порака наместо error
        // this.toast.info('This package will be available soon.');
        console.info('Package not ready yet.');
        this.loadingId = null;
      }
    } catch {
      // this.toast.error('Payment init failed.');
      this.loadingId = null;
    }
  }

}
