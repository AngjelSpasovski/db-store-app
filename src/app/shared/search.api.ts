// src/app/shared/search.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { environment } from '../auth/auth.environment';
import { DummyIdService } from '../user/new-research/dummy-id.service';

export interface SearchByIdResult {
  found: boolean;
  downloadUrl?: string;
  remainingCredits?: number;
}

@Injectable({ providedIn: 'root' })
export class SearchApi {
  private api = (environment.baseApiUrl ?? '/api/v1').replace(/\/+$/, '');

  constructor(
    private http: HttpClient,
    private dummy: DummyIdService,
  ) {}

  /**
   * TEMP: локална симулација додека нема backend endpoint.
   * Користиме DummyIdService и враќаме празен PDF ако е најден.
   */
  searchById(id: string): Observable<SearchByIdResult> {
    const normalized = (id || '').trim().toUpperCase();
    const found = this.dummy.exists(normalized);

    // TODO: направи едноставен празен PDF во assets, пример:
    // src/assets/search/blank-result.pdf
    const downloadUrl = found ? 'assets/dummy-search/dummy_pdf.pdf' : undefined;

    return of({ found, downloadUrl }).pipe(delay(400));
  }

  // ⬇️ Овој дел можеш да го користиш кога ќе биде готов backend-от:
  // private realSearch(id: string): Observable<SearchByIdResult> {
  //   return this.http.get<SearchByIdResult>(`${this.api}/users/me/search`, {
  //     params: { id }
  //   });
  // }
}
