// src/app/shared/search.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
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
   * Search one person by Personal ID / id_match.
   * За сега:
   *  - ако dataMode === 'local' → dummy список (DummyIdService)
   *  - ако dataMode === 'api'   → фрла грешка (нема backend endpoint уште)
   */
  searchById(id: string): Observable<SearchByIdResult> {
    if (environment.dataMode === 'local') {
      const found = this.dummy.exists(id);
      const downloadUrl = found
        ? 'assets/privacy/privacy-policy-it.pdf'
        : undefined;

      // мал fake delay да изгледа „реално“
      return of({ found, downloadUrl }).pipe(delay(400));
    }

    // TODO: кога backend ќе направи реално search endpoint
    return throwError(
      () => new Error('Search by Personal ID is not implemented on the backend yet.')
    );
  }
}
