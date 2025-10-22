// src/app/shared/http-billing.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BillingApi, BillingRow } from './billing.api';

@Injectable({ providedIn: 'root' })
export class HttpBillingApi extends BillingApi {
  private base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');
  constructor(private http: HttpClient) { super(); }

  // TODO: кога ќе има бекенд, одкоментирај ја линијата со http и избриши of([])
  listMyPayments(): Observable<BillingRow[]> {
    // return this.http.get<BillingRow[]>(`${this.base}/billing`);
    return of([]);
  }
}
