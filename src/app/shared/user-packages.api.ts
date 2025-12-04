// src/app/shared/user-packages.api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface UserPackageDto {
  id: number;
  name: string;
  description: string | null;
  credits: number;
  price: number;
  discountPercentage: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPackagesResponse {
  list: UserPackageDto[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class UserPackagesApi {
  private readonly baseUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * GET /api/v1/packages
   * Params: perPage, page
   * Backend враќа: { list: UserPackageDto[], total: number }
   */
  getPackages(perPage = 50, page = 1): Observable<UserPackagesResponse> {
    const params = new HttpParams()
      .set('perPage', perPage)
      .set('page', page);

    return this.http
      .get<UserPackagesResponse>(`${this.baseUrl}/packages`, { params })
      .pipe(
        map(res => {
          const list = res?.list ?? [];
          const total = typeof res?.total === 'number' ? res.total : list.length;
          return { list, total };
        })
      );
  }
}
