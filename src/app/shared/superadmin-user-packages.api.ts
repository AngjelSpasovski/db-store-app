// src/app/shared/superadmin-user-packages.api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { catchError, of } from 'rxjs';

export interface AssignUserPackagePayload {
  packageId: number;
  reason?: string | null;
}

export interface UserPackageDto {
  id:               number;          // userPackageId
  userId:           number;
  packageId:        number;
  creditsRemaining: number;
  expiresAt:        string | null;
  createdAt:        string;
  updatedAt:        string;

  // ако backend враќа embed-нат package објект:
  package?: {
    id:                 number;
    name:               string;
    description:        string | null;
    credits:            number;
    price:              number;
    discountPercentage: number | string;
    isActive:           boolean;
    createdAt:          string;
    updatedAt:          string;
  };
}

export interface UserPackagesListResponse {
  list: UserPackageDto[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class SuperadminUserPackagesApi {
  private readonly apiBase = (environment.baseApiUrl ?? '').replace(/\/+$/, '');
  private readonly baseUrl = `${this.apiBase}/superadmin/users`;


  constructor(private http: HttpClient) {}

  // GET /superadmin/users/{id}/packages
  getUserPackages(userId: number, perPage = 50, page = 1): Observable<UserPackagesListResponse> {
    const params = new HttpParams()
      .set('perPage', String(perPage))
      .set('page', String(page));

    return this.http
      .get<UserPackagesListResponse>(`${this.baseUrl}/${userId}/packages`, { params })
      .pipe(
        catchError((err) => {
          if (err?.status === 404) {
            // endpoint не постои во backend -> празно, без да кршиме UI
            return of({ list: [], total: 0 });
          }
          throw err;
        })
      );
  }

  // POST /superadmin/users/{id}/packages
  assign(userId: number, payload: AssignUserPackagePayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/${userId}/packages`, payload);
  }

  // DELETE /superadmin/users/{id}/packages/{userPackageId}
  remove(userId: number, userPackageId: number): Observable<{ status: true }> {
    return this.http.delete<{ status: true }>(
      `${this.baseUrl}/${userId}/packages/${userPackageId}`
    );
  }
}
