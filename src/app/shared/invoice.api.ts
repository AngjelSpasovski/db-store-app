import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type InvoiceStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'PAID';

export interface InvoicePackage {
  id: number;
  name: string;
  description?: string;
  credits: number;
  price: number;
  discountPercentage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceBillingDetails {
  id: number;
  userId: number;
  email: string;
  companyName: string;
  address1: string;
  address2?: string | null;
  buildingNumber?: string | null;
  zipcode: string;
  city: string;
  stateCode: string;
  nation: string;
  vatNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDto {
  id: number;
  userId: number;
  packageId: number;
  stripeSessionId: string | null;
  credits: number;
  amount: number;
  receiptUrl?: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;

  stripePaymentIntentId?: string | null;
  paymentMethod?: string | null;

  package: InvoicePackage | null;

  // може да е null, зависи од backend
  billing_details: InvoiceBillingDetails | null;
}

/**
 * Реален shape на response-от од GET /api/v1/users/me/invoices
 * (од Network снимката): има invoices + billingDetails.
 */
interface InvoicesResponseRaw {
  list?: InvoiceDto[];                          // ако некаде користат "list"
  invoices?: InvoiceDto[];                      // real-world key
  billingDetails?: InvoiceBillingDetails | null;
  // има уште userPackages, transactions, customer... не ни се битни тука
}

export interface InvoicesResponse {
  invoices: InvoiceDto[];
  billingDetails: InvoiceBillingDetails | null;
}

interface ListInvoicesResponse {
  list: InvoiceDto[];
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class InvoiceApi {
  private base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  /**
   * Враќа и фактури и billingDetails од ист endpoint.
   */
  listMyInvoices(): Observable<InvoiceDto[]> {
    return this.http
      .get<ListInvoicesResponse>(`${this.base}/users/me/invoices`)
      .pipe(map(res => res?.list ?? []));
  }
}
