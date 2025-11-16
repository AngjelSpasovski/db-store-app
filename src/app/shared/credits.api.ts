// src/app/shared/credits.api.ts
import { Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CreditsApi {
  /** Returns remaining credits for current user */
  getMyCredits(): Observable<number>;
}

export const CREDITS_API = new InjectionToken<CreditsApi>('CREDITS_API');

@Injectable()
export class HttpCreditsApi implements CreditsApi {
  constructor(private http: HttpClient) {}

  getMyCredits(): Observable<number> {
    return this.http
      .get<{ credits: number }>('/api/v1/users/me/credits')
      .pipe(map(res => res.credits ?? 0));
  }
}
