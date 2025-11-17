// src/app/shared/data-request.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DataRequestRow {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  expiredAt: string | null;
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
  private readonly baseUrl = '/api/v1/users/me/data-requests';

  constructor(private http: HttpClient) {}

  /** Враќа листа на сите data-requests за логираниот user */
  list(): Observable<DataRequestRow[]> {
    return this.http
      .get<ListResponse>(this.baseUrl)
      .pipe(map(res => res.list ?? []));
  }

  /** Креира нов data-request со upload на CSV/Excel */
  create(file: File): Observable<DataRequestRow> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<CreateResponse>(this.baseUrl, formData)
      .pipe(map(res => res.dataRequest));
  }

  /** Download на CSV од одреден request */
  download(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }
}
