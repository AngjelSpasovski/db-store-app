// src/app/user/buy-credits/buy-credits.component.ts
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener   } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../shared/toast.service';

import { AuthService, AuthUser } from '../../auth/auth.service';
import { PaymentsService } from '../../shared/payments.service';
import { CreditPackage } from './credit-packages.config';
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

  public packages: CreditPackage[] = [];
  public loadingPackages = false;
  public packagesError: string | null = null;

  public loadingId: string | null = null;
  public environment = environment;

  constructor(
    private auth: AuthService,
    private payments: PaymentsService,
    private toast: ToastService,
    private creditsSvc: CreditsService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  @HostListener('window:pageshow', ['$event'])
  onPageShow(_event: PageTransitionEvent) {
    // Кога се враќаме од Stripe со browser Back,
    // осигурај се дека нема повеќе "PROCESSING..." блокирани копчиња
    this.loadingId = null;
    this.cdr.markForCheck();
  }

  public ngOnInit(): void {
    const qp = new URLSearchParams(window.location.search);

    if (qp.get('canceled') === '1') {
      this.toast.info(
        this.translate.instant('PAYMENT_CANCELED'),
        { position: 'top-end' }
      );
    }

    if (qp.get('success') === '1') {
      this.toast.success(
        this.translate.instant('PAYMENT_COMPLETED_SUCCESSFULLY'),
        { position: 'top-end' }
      );
      this.creditsSvc.refreshFromApi();
    }

    if (qp.has('canceled') || qp.has('success')) {
      history.replaceState({}, '', window.location.pathname);
    }

    // за секој случај – и на fresh load да е null
    this.loadingId = null;

    this.creditsSvc.refreshFromApi();
    this.loadPackagesFromBackend();
  }

  private loadPackagesFromBackend(): void {
    this.loadingPackages = true;
    this.packagesError = null;

    this.creditsSvc.loadPackages().subscribe({
      next: pkgs => {
        this.packages = pkgs;
        this.loadingPackages = false;
        this.cdr.markForCheck();           // OnPush
      },
      error: () => {
        this.packages = [];
        this.loadingPackages = false;
        this.packagesError = this.translate.instant(
          'CREDIT_PACKAGES_LOAD_FAILED'
        );
        this.cdr.markForCheck();           // OnPush
      }
    });

  }

  public trackByPkg = (_: number, pkg: CreditPackage) => pkg.id;

  public canBuy(pkg: CreditPackage): boolean {
    // API mode → само проверуваме дали имаме backendId
    return typeof pkg.backendId === 'number';
  }

  async purchase(pkg: CreditPackage) {
    if (this.loadingId || !this.canBuy(pkg)) return;

    this.loadingId = pkg.id;

    try {
      this.payments.start({
        packageId: pkg.backendId!,        // backend ID
        paymentLinkUrl: '',               // не користиме paymentLinks во овој flow
      });
    } finally {
      setTimeout(() => {
        if (this.loadingId === pkg.id) {
          this.loadingId = null;
        }
      }, 4000);
    }
  }

  // discount related helpers for price calculations
  public discountPct(pkg: CreditPackage): number {
    const n = Number(pkg.discountPercentage ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, n));
  }

  // discount related helpers for having discount
  public hasDiscount(pkg: CreditPackage): boolean {
    return this.discountPct(pkg) > 0;
  }

  // discount related helpers for discounted price
  public discountedPrice(pkg: CreditPackage): number {
    const d = this.discountPct(pkg);
    const base = Number(pkg.price ?? 0);
    const final = base * (1 - d / 100);
    return Number(final.toFixed(2));
  }

}
