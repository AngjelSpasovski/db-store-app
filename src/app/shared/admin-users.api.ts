// src/app/shared/admin-users.api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface AdminUserDetails extends AdminUserSummary {
  companyName?: string | null;
  country?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // тука можеш да додадеш уште полиња според Swagger
}

export interface AdminUsersListResponse {
  list: AdminUserSummary[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersApi {
  private readonly baseUrl = '/api/v1/admin/users';

  constructor(private http: HttpClient) {}

  getUsers(perPage = 10, page = 1): Observable<AdminUsersListResponse> {
    const params = new HttpParams()
      .set('perPage', perPage)
      .set('page', page);

    return this.http.get<AdminUsersListResponse>(this.baseUrl, { params });
  }

  getUserDetails(id: number): Observable<AdminUserDetails> {
    return this.http.get<AdminUserDetails>(`${this.baseUrl}/${id}`);
  }

  updateStatus(id: number, isActive: boolean): Observable<AdminUserSummary> {
    // според Swagger: PATCH /api/v1/admin/users/{id}/status
    return this.http.patch<AdminUserSummary>(
      `${this.baseUrl}/${id}/status`,
      { isActive }
    );
  }
}
