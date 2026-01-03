// src/app/shared/superadmin-packages.api.ts
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
  createdAt: string;
  updatedAt: string;
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
  private readonly apiBase = (environment.baseApiUrl ?? '').replace(/\/+$/, '');
  private readonly baseUrl = `${this.apiBase}/superadmin/packages`;

  constructor(private http: HttpClient) {}

  getPackages(perPage = 50, page = 1): Observable<PackagesListResponse> {
    const params = new HttpParams()
      .set('perPage', String(perPage))
      .set('page', String(page));

    return this.http.get<PackagesListResponse>(this.baseUrl, { params });
  }

  createPackage(payload: PackagePayload): Observable<SuperadminPackageDto> {
    return this.http.post<SuperadminPackageDto>(this.baseUrl, payload);
  }

  updatePackage(id: number, payload: PackagePayload): Observable<SuperadminPackageDto> {
    return this.http.patch<SuperadminPackageDto>(`${this.baseUrl}/${id}`, payload);
  }

  deactivatePackage(id: number): Observable<{ status: boolean }> {
    return this.http.patch<{ status: boolean }>(`${this.baseUrl}/${id}/deactivate`, {});
  }
}
