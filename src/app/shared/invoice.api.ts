import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type InvoiceStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'PAID';

export interface InvoicePackage {
  id:                   number;
  name:                 string;
  description?:         string;
  credits:              number;
  price:                number;
  discountPercentage?:  string;
  isActive:             boolean;
  createdAt:            string;
  updatedAt:            string;
}

export interface InvoiceBillingDetails {
  id:               number;
  userId:           number;
  email:            string;
  companyName:      string;
  address1:         string;
  address2?:        string | null;
  buildingNumber?:  string | null;
  zipcode:          string;
  city:             string;
  stateCode:        string;
  nation:           string;
  vatNumber:        string;
  createdAt:        string;
  updatedAt:        string;
}

export interface InvoiceDto {
  id:               number;
  userId:           number;
  packageId:        number;
  stripeSessionId:  string | null;
  credits:          number;
  amount:           number;
  receiptUrl?:      string;
  status:           InvoiceStatus;
  createdAt:        string;
  updatedAt:        string;

  stripePaymentIntentId?: string | null;
  paymentMethod?:         string | null;

  package:          InvoicePackage | null;
  billing_details:  InvoiceBillingDetails | null;  // може да е null, зависи од backend
}

/**
 * Реален shape на response-от од GET /api/v1/users/me/invoices
 * (од Network снимката): има invoices + billingDetails.
 * Реалниот response (варира: list или invoices + billingDetails)
 * */
interface InvoicesResponseRaw {
  list?:              InvoiceDto[];
  invoices?:          InvoiceDto[];
  billingDetails?:    InvoiceBillingDetails | null;
  user?: {
    billingDetails?:  InvoiceBillingDetails | null
  }; // fallback ако некој бекенд враќа вака
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


 /** враќа invoices + billingDetails */
 listMyInvoicesWithBillingDetails(): Observable<InvoicesResponse> {
  return this.http
    .get<InvoicesResponseRaw>(`${this.base}/users/me/invoices`)
    .pipe(
      map((res) => {
        const invoices = res?.list ?? res?.invoices ?? [];
        const billingDetails = res?.billingDetails ?? res?.user?.billingDetails ?? null;
        return { invoices, billingDetails };
      })
    );
}

  /**
   * Враќа и фактури и billingDetails од ист endpoint.
   */
  listMyInvoices(): Observable<InvoiceDto[]> {
    return this.listMyInvoicesWithBillingDetails().pipe(map(r => r.invoices));
  }
}
