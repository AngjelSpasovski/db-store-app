// src/app/shared/data-request.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DataRequestRow {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  expiredAt: string | null;
  matchesCount?: number | null;
}

// POST response
interface CreateResponse {
  dataRequest: DataRequestRow;
}

@Injectable({ providedIn: 'root' })
export class DataRequestApi {
  private readonly baseUrl = `${environment.baseApiUrl}/users/me/data-requests`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/users/me/data-requests */
  listMyRequests(): Observable<DataRequestRow[]> {
    return this.http.get<any>(this.baseUrl).pipe(
      map(res => {
        // безбедно: поддржи и array и обвивка, ако ја сменат во иднина
        if (Array.isArray(res)) return res as DataRequestRow[];
        if (Array.isArray(res?.list)) return res.list as DataRequestRow[];
        return [];
      })
    );
  }

  /** POST /api/v1/users/me/data-requests  (multipart/form-data) */
  create(file: File): Observable<CreateResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CreateResponse>(this.baseUrl, formData);
  }

  /** GET /api/v1/users/me/data-requests/{id}/download  (text/csv) */
  download(id: number): Observable<Blob> {
    const url = `${environment.baseApiUrl}/users/me/data-requests/${id}/download`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
