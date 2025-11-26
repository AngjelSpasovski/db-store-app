// src/app/shared/invoice.api.ts
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
  discountPercentage?: string; // 👈 ако backend некаде го праќа
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

// според Swagger: GET /api/v1/users/me/invoices → { list: [...] }
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

  // нови полиња од backend (ги има во response-от)
  stripePaymentIntentId?: string | null;
  paymentMethod?: string | null;

  package: InvoicePackage | null;
  billing_details: InvoiceBillingDetails | null;
}

interface ListInvoicesResponse {
  list: InvoiceDto[];
}

@Injectable({ providedIn: 'root' })
export class InvoiceApi {
  private base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  listMyInvoices(): Observable<InvoiceDto[]> {
    return this.http
      .get<ListInvoicesResponse>(`${this.base}/users/me/invoices`)
      .pipe(map(res => res.list ?? []));
  }
}
