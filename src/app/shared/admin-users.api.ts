// src/app/shared/admin-users.api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AdminUserSummary {
  id:       number;
  name:     string;
  email:    string;
  role:     string;
  isActive: boolean;
}

export interface AdminUserDetails extends AdminUserSummary {
  companyName?: string | null;
  country?:     string | null;
  phone?:       string | null;
  createdAt?:   string;
  updatedAt?:   string;
}

export interface AdminUsersListResponse {
  list:   AdminUserSummary[];
  total:  number;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersApi {
  // 👇 наместо '/api/v1/admin/users'
  private readonly baseUrl = `${environment.baseApiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  // GET /api/v1/admin/users
  getUsers(perPage = 10, page = 1): Observable<AdminUsersListResponse> {
    const params = new HttpParams()
      .set('perPage', String(perPage))
      .set('page',    String(page));

    return this.http.get<AdminUsersListResponse>(this.baseUrl, { params });
  }

  // GET /api/v1/admin/users/{id}
  getUserDetails(id: number): Observable<AdminUserDetails> {
    return this.http.get<AdminUserDetails>(`${this.baseUrl}/${id}`);
  }

  // PATCH /api/v1/admin/users/{id}/status
  updateStatus(id: number, isActive: boolean): Observable<AdminUserSummary> {
    return this.http.patch<AdminUserSummary>(
      `${this.baseUrl}/${id}/status`,
      { isActive }
    );
  }
}
