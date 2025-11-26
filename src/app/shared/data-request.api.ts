// src/app/shared/data-request.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DataRequestRow {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  expiredAt: string | null;
}

// ако ти затреба подоцна за детална сметка
export interface DataRequestDto {
  id: number;
  file: string;
  status: string;      // e.g. "NEW", "READY", "ERROR"
  createdAt: string;
  expireAt: string;
  updatedAt: string;
}

// од Swagger: GET /api/v1/users/me/data-requests -> { list: [...] }
interface ListResponse {
  list: DataRequestRow[];
}

// од Swagger: POST /api/v1/users/me/data-requests -> { dataRequest: {...} }
interface CreateResponse {
  dataRequest: DataRequestRow;
}

@Injectable({ providedIn: 'root' })
export class DataRequestApi {
  // пример: https://web-society.xyz-dev.com/api/v1/users/me/data-requests
  private readonly baseUrl = `${environment.baseApiUrl}/users/me/data-requests`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/users/me/data-requests */
  listMyRequests(): Observable<ListResponse> {
    return this.http.get<ListResponse>(this.baseUrl);
  }

  /** POST /api/v1/users/me/data-requests  (multipart/form-data) */
  create(file: File): Observable<CreateResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<CreateResponse>(this.baseUrl, formData);
  }

  /** GET /api/v1/users/me/data-requests/{id}/download  (text/csv) */
  download(id: number): Observable<Blob> {
    const url = `${this.baseUrl}/${id}/download`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
