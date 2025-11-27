// src/app/shared/search.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SingleSearchResult {
  found: boolean;
  csv: string;
  blob: Blob;
  requestId: number;   // ID на data-request од backend
}

@Injectable({ providedIn: 'root' })
export class SearchApi {

  private readonly baseReqUrl = `${environment.baseApiUrl}/users/me/data-requests`;

  constructor(private http: HttpClient) {}

  /**
   * Single search → правиме bulk request со 1 ID.
   */
  searchById(id_match: string): Observable<SingleSearchResult> {

    const file = new File([id_match.trim()], 'single-id.txt', {
      type: 'text/plain',
    });

    const form = new FormData();
    form.append('file', file);

    return this.http.post<any>(this.baseReqUrl, form).pipe(
      switchMap(res => {
        const reqId = res?.dataRequest?.id as number | undefined;
        if (!reqId) throw new Error('Invalid data request response');

        const url = `${this.baseReqUrl}/${reqId}/download`;
        return this.http.get(url, { responseType: 'blob' }).pipe(
          switchMap(blob =>
            blob.arrayBuffer().then(buffer => {
              const csvText = new TextDecoder('utf-8').decode(buffer);
              const found = csvText
                .toUpperCase()
                .includes(id_match.trim().toUpperCase());

              return {
                found,
                csv: csvText,
                blob,
                requestId: reqId,
              } as SingleSearchResult;
            })
          )
        );
      })
    );
  }
}
