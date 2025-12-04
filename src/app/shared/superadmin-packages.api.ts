// src/app/home/shared/superadmin-packages.api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private readonly baseUrl = '/api/v1/superadmin/packages';

  constructor(private http: HttpClient) {}

  getPackages(perPage = 50, page = 1): Observable<PackagesListResponse> {
    const params = new HttpParams()
      .set('perPage', perPage)
      .set('page', page);

    return this.http.get<PackagesListResponse>(this.baseUrl, { params });
  }

  // 🔹 CREATE: враќа директно SuperadminPackageDto
  createPackage(payload: PackagePayload): Observable<SuperadminPackageDto> {
    return this.http.post<SuperadminPackageDto>(this.baseUrl, payload);
  }

  // 🔹 UPDATE: исто
  updatePackage(id: number, payload: PackagePayload): Observable<SuperadminPackageDto> {
    return this.http.patch<SuperadminPackageDto>(
      `${this.baseUrl}/${id}`,
      payload
    );
  }

  // 🔹 DELETE: URL-от да не има двојно /packages
  deletePackage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
