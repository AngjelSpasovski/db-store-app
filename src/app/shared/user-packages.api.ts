// src/app/shared/user-packages.api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
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
  // 👇 секогаш од environment
  private readonly baseUrl = environment.baseApiUrl;

  constructor(private http: HttpClient) {}

  getPackages(perPage = 50, page = 1): Observable<UserPackagesResponse> {
    const params = new HttpParams()
      .set('perPage', perPage)
      .set('page', page);

    return this.http
      .get<UserPackagesResponse>(`${this.baseUrl}/packages`, { params });
  }
}

