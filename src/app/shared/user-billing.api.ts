import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../auth/auth.environment';

export interface BillingDetails {
  id: number;
  userId: number;
  email: string;
  companyName: string;
  address1: string;
  address2?: string;
  buildingNumber?: string;
  zipcode: string;
  city: string;
  stateCode: string;
  nation: string;
  vatNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BillingDetailsCreateDto = Omit<BillingDetails, 'id'|'userId'|'createdAt'|'updatedAt'>;
export type BillingDetailsPatchDto  = Partial<BillingDetailsCreateDto>;

export interface InvoicePackage {
  id: number;
  name: string;
  description?: string;
  credits: number;
  price: number;
  durationDays: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceRow {
  id: number;
  userId: number;
  packageId: number;
  package: InvoicePackage;
  status: 'PENDING'|'PAID'|'FAILED'|'CANCELED'|string;
  amount: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paged<T> {
  list: T[];
  total: number;
}

export interface StripeCheckoutReq {
  packageId: number;
}

export interface StripeCheckoutRes {
  sessionId: string;
  checkoutUrl: string;
  invoiceId: number;
}

@Injectable({ providedIn: 'root' })
export class UserBillingApi {

  private api = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  // ==== Billing details ====

  getBillingDetails() {
    return this.http.get<{ billing_details: BillingDetails }>(
      `${this.api}/users/me/billing-details`
    );
  }

  createBillingDetails(body: BillingDetailsCreateDto) {
    return this.http.post<{ billing_details: BillingDetails }>(
      `${this.api}/users/me/billing-details`,
      body
    );
  }

  patchBillingDetails(body: BillingDetailsPatchDto) {
    return this.http.patch<{ billing_details: BillingDetails }>(
      `${this.api}/users/me/billing-details`,
      body
    );
  }

  // ==== Invoices ====

  listInvoices(perPage = 20, page = 1) {
    const params = new HttpParams()
      .set('perPage', String(perPage))
      .set('page', String(page));

    return this.http.get<Paged<InvoiceRow>>(
      `${this.api}/users/me/invoices`,
      { params }
    );
  }

  createInvoice(packageId: number) {
    return this.http.post<{ invoice: InvoiceRow }>(
      `${this.api}/users/me/invoices`,
      { packageId }
    );
  }

  // ==== Stripe checkout ====

  createStripeCheckout(packageId: number) {
    const body: StripeCheckoutReq = { packageId };

    // base = "/api/v1" → го тргаме само "/v1" за Stripe
    const base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, ''); // "/api/v1"
    const stripeBase = base.replace(/\/v1$/, '');                        // "/api"

    return this.http.post<StripeCheckoutRes>(
      `${stripeBase}/stripe/checkout/create`,
      body
    );
  }
}
