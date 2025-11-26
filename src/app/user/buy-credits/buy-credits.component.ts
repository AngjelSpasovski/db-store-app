// src/app/user/buy-credits/buy-credits.component.ts
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../shared/toast.service';

import { AuthService, AuthUser } from '../../auth/auth.service';
import { PaymentsService } from '../../shared/payments.service';
import { CREDIT_PACKAGES, CreditPackage } from './credit-packages.config';
import { CreditsService } from './credit.service';

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

  public credits$ = this.creditsSvc.credits$;

  // ✅ единствен извор на пакети
  public packages = CREDIT_PACKAGES;
  public loadingId: string | null = null;

  public environment = environment;

  constructor(
    private auth: AuthService,
    private payments: PaymentsService,
    private toast: ToastService,
    private creditsSvc: CreditsService,
  ) {}

  public ngOnInit(): void {
    const qp = new URLSearchParams(window.location.search);

    if (qp.get('canceled') === '1') {
      this.toast.info('Payment canceled.', { position: 'top-end' });
    }

    if (qp.get('success') === '1') {
      this.toast.success('Payment completed successfully.', { position: 'top-end' });
      // ✅ после успешно плаќање – рефреш кредити
      this.creditsSvc.refreshFromApi();
    }

    if (qp.has('canceled') || qp.has('success')) {
      history.replaceState({}, '', window.location.pathname);
    }

    // ✅ секое влегување во /user/buy-credits ќе си ги повлече кредитите
    this.creditsSvc.refreshFromApi();
  }

  public trackByPkg = (_: number, pkg: CreditPackage) => pkg.id;

  public canBuy(pkg: CreditPackage): boolean {
    if (environment.paymentsMode === 'paymentLinks') {
      return !!pkg.paymentLinkUrl;
    }
    // 'api' mode → мора да има валиден backendId
    return typeof pkg.backendId === 'number';
  }

  async purchase(pkg: CreditPackage) {
    if (this.loadingId || !this.canBuy(pkg)) return;

    this.loadingId = pkg.id;

    try {
      this.payments.start({
        packageId: pkg.backendId!,
        paymentLinkUrl: pkg.paymentLinkUrl ?? '',
      });
    } finally {
      // ако не нè редиректира (грешка), копчето да не остане заглавено
      setTimeout(() => {
        if (this.loadingId === pkg.id) {
          this.loadingId = null;
        }
      }, 4000);
    }
  }

}
