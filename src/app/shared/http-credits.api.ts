// src/app/shared/http-credits.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CreditsApi } from './credits.api';

@Injectable({ providedIn: 'root' })
export class HttpCreditsApi extends CreditsApi {
  private base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');
  constructor(private http: HttpClient) { super(); }

  // TODO: кога ќе има бекенд, одкоментирај ја линијата со http и избриши of(0)
  getMyCredits(): Observable<number> {
    // return this.http.get<number>(`${this.base}/credits/me`);
    return of(0);
  }
}
