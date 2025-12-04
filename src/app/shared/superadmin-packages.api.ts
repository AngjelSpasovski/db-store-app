// src/app/home/shared/superadmin-packages.api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SuperadminPackageDto {
  id: number;
  name: string;
  description: string | null;
  credits: number;
  price: number;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;  // ISO
  updatedAt: string;  // ISO
}

export interface PackagesListResponse {
  list: SuperadminPackageDto[];
  total: number;
}

export interface PackagePayload {
  name: string;
  description?: string | null;
  credits: number;
  price: number;
  discountPercentage: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class SuperadminPackagesApi {
  // baseApiUrl:
  //  - dev: '/api/v1'
  //  - prod: 'https://web-society.kps-dev.com/api/v1'
  private readonly apiBase = (environment.baseApiUrl ?? '').replace(/\/+$/, '');
  private readonly baseUrl = `${this.apiBase}/superadmin/packages`;

  constructor(private http: HttpClient) {}

  getPackages(perPage = 50, page = 1): Observable<PackagesListResponse> {
    const params = new HttpParams()
      .set('perPage', String(perPage))
      .set('page', String(page));

    return this.http.get<PackagesListResponse>(this.baseUrl, { params });
  }

  /** CREATE */
  createPackage(payload: PackagePayload): Observable<SuperadminPackageDto> {
    return this.http.post<SuperadminPackageDto>(this.baseUrl, payload);
  }

  /** UPDATE */
  updatePackage(id: number, payload: PackagePayload): Observable<SuperadminPackageDto> {
    return this.http.patch<SuperadminPackageDto>(
      `${this.baseUrl}/${id}`,
      payload
    );
  }

  /** DELETE */
  deletePackage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
