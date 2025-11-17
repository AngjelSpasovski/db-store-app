// src/app/shared/http-credits.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { CreditsApi } from './credits.api';

@Injectable({ providedIn: 'root' })
export class HttpCreditsApi implements CreditsApi {

  constructor(private http: HttpClient) {}

  getMyCredits(): Observable<number> {
    return this.http
      .get<{ credits: number }>('/api/v1/users/me/credits')
      .pipe(map(res => res.credits ?? 0));
  }
}
