import { Injectable } from '@angular/core';

export interface Invoice {
  id: string;       // e.g. 'INV-20250528-001'
  timestamp: string;
  amount: number;   // USD
  credits: number;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private storageKey = 'app_billing_history';

  /** Fetch all invoices (newest first) */
  getAll(): Invoice[] {
    const raw = sessionStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  /** Add a new invoice and persist */
  add(invoice: Invoice): void {
    const list = this.getAll();
    list.unshift(invoice);
    sessionStorage.setItem(this.storageKey, JSON.stringify(list));
  }
}