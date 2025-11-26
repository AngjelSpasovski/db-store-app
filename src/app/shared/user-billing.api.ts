// src/app/user/user-billing.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
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
  createdAt: string;
  updatedAt: string;
}

export interface BillingDetailsPayload {
  email: string;
  companyName?: string;
  address1?: string;
  address2?: string;
  buildingNumber?: string;
  zipcode?: string;
  city?: string;
  stateCode?: string;
  nation?: string;
  vatNumber?: string;
}


/** Точно како што враќа Swagger: { billing_details: { ... } } */
export interface BillingDetailsResponse {
  billing_details: BillingDetails | null;
}

export interface StripeCheckoutReq {
  packageId: number;
  successUrl?: string;
  cancelUrl?: string;
}

export interface StripeCheckoutRes {
  sessionId: string;
  redirectUrl: string;
}

@Injectable({ providedIn: 'root' })
export class UserBillingApi {
  private base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  /** GET /api/v1/users/me/billing-details */
  getMyBillingDetails() {
    return this.http
      .get<{ billing_details: BillingDetails | null }>(
        `${this.base}/users/me/billing-details`
      )
      .pipe(
        map(res => res.billing_details ?? null)
      );
  }

  /**
   * POST /api/v1/users/me/billing-details
   * create или FULL update (како што пишува во Swagger)
   */
  saveMyBillingDetails(payload: BillingDetailsPayload) {
    return this.http
      .post<{ billing_details: BillingDetails }>(
        `${this.base}/users/me/billing-details`,
        payload
      )
      .pipe(
        map(res => res.billing_details)
      );
  }

  /**
   * PATCH /api/v1/users/me/billing-details
   * partial update – ако сакаш да менуваш само дел од полињата
   */
  patchBillingDetails(payload: Partial<BillingDetailsPayload>) {
    return this.http
      .patch<BillingDetailsResponse>(`${this.base}/users/me/billing-details`, payload)
      .pipe(map(res => res.billing_details));
  }

  /** Stripe checkout за купување кредити – го користиме постоечкиот endpoint */
  createStripeCheckout(packageId: number) {
    const body: StripeCheckoutReq = { packageId };

    // base = "/api/v1" → го тргаме само "/v1" за Stripe → "/api"
    const base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');
    const stripeBase = base.replace(/\/v1$/, '');

    return this.http.post<StripeCheckoutRes>(
      `${stripeBase}/stripe/checkout/create`,
      body
    );
  }
}
