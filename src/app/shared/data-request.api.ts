// src/app/shared/data-request.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DataRequestRow {
  id: number;
  userId: number;
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DataRequestApi {

  constructor(private http: HttpClient) {}

  /** GET /api/v1/users/me/data-requests */
  list(): Observable<DataRequestRow[]> {
    return this.http
      .get<{ list: DataRequestRow[] }>('/api/v1/users/me/data-requests')
      .pipe(map(res => res.list ?? []));
  }

  /** POST /api/v1/users/me/data-requests (file upload) */
  upload(file: File): Observable<DataRequestRow> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<{ dataRequest: DataRequestRow }>('/api/v1/users/me/data-requests', form)
      .pipe(map(res => res.dataRequest));
  }

  /** alias – компонентата вика create(...) */
  create(file: File): Observable<DataRequestRow> {
    return this.upload(file);
  }

  /** GET /api/v1/users/me/data-requests/{id}/download → CSV */
  download(id: number): Observable<Blob> {
    return this.http.get(`/api/v1/users/me/data-requests/${id}/download`, {
      responseType: 'blob',
    });
  }
}
