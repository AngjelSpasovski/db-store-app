import { Component, OnInit, ChangeDetectionStrategy, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';      // for *ngFor, *ngIf, etc.
import { AuthService } from '../../auth/auth.service';
import { RouterModule } from '@angular/router';     // if you ever use routerLink here
import { TranslateModule } from '@ngx-translate/core';
import { Toast } from 'bootstrap';

import { BillingService, Invoice } from '../billing/billing.service';
import { CreditsService } from '../buy-credits/credit.service';

import type { AuthUser } from '../../auth/auth.service';

interface CreditPackage {
  price: string;
  credits: number;
}

@Component({
  selector: 'app-buy-credits',
  templateUrl: './buy-credits.component.html',
  styleUrls: ['./buy-credits.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuyCreditsComponent implements OnInit {
  creditPackages: CreditPackage[] = [
    { price: '199€',  credits: 300 },
    { price: '275€',  credits: 500 },
    { price: '500€',  credits: 1000 },
    { price: '800€',  credits: 2000 },
    { price: '1500€', credits: 5000 },
    { price: '2500€', credits: 10000 },
    { price: '3000€', credits: 15000 }
  ];

  currentUser: AuthUser | null = null;
  currentCredits = 0;

  constructor(
    private auth: AuthService,
    private renderer: Renderer2,
    private billingSvc: BillingService,
    private creditsSvc: CreditsService,
  ) {}

  ngOnInit(): void {
    // Load the logged-in user and initialize credits
    this.currentUser = this.auth.getCurrentUser();
    if (this.currentUser) {

      const storageKey = `credits_${this.currentUser.email}`;
      const stored = sessionStorage.getItem(storageKey);
      
      this.currentCredits = stored ? +stored : 0;

      if (!stored) {
        sessionStorage.setItem(storageKey, '0');
      }
    }
  }

  /** trackBy for performance */
  trackByCredits(_idx: number, pkg: CreditPackage) {
    return pkg.credits;
  }

  async purchase(pkg: CreditPackage): Promise<void> {
    
    setTimeout(() => {
      debugger;

      const now = new Date();
      const invoice: Invoice = {
        id: `INV-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getTime()}`,
        timestamp: now.toLocaleString(),
        amount: parseFloat(pkg.price.replace('$','')),  // assumes format '$10'
        credits: pkg.credits
      };
      this.billingSvc.add(invoice);            // ← record invoice

      this.creditsSvc.addCredits(pkg.credits);

      if (this.currentUser) {
        const key = `credits_${this.currentUser.email}`;
        this.currentCredits += pkg.credits;
        sessionStorage.setItem(key, this.currentCredits.toString());
      }

      const container = document.getElementById('toast-container');
      if (!container) return;

      const toastEl = this.renderer.createElement('div');
      this.renderer.addClass(toastEl, 'toast');
      this.renderer.addClass(toastEl, 'align-items-center');
      this.renderer.addClass(toastEl, 'text-bg-success');
      this.renderer.addClass(toastEl, 'border-0');
      this.renderer.setAttribute(toastEl, 'role', 'alert');
      this.renderer.setAttribute(toastEl, 'aria-live', 'assertive');
      this.renderer.setAttribute(toastEl, 'aria-atomic', 'true');

      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            You purchased ${pkg.credits} credits for ${pkg.price}.
          </div>
          <button type="button"
                  class="btn-close btn-close-white me-2 m-auto"
                  data-bs-dismiss="toast"
                  aria-label="Close"></button>
        </div>`;

      this.renderer.appendChild(container, toastEl);

      // Пушти го toast-от
      const bsToast = new Toast(toastEl, { delay: 2000 });
      bsToast.show();

    }, 1000);

  }


}
// Note: This component is standalone, so it can be used directly in the template of UserComponent
// without needing to declare it in a module. It can be imported directly in the UserModule or any other module that needs it.