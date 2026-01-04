// src/app/shared/superadmin-admins.api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SuperadminAdminDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string | null;
  role?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminsListResponse {
  list: SuperadminAdminDto[];
  total: number;
}

export interface CreateAdminPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string | null;
}

export interface UpdateAdminPayload {
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class SuperadminAdminsApi {
  private readonly apiBase = (environment.baseApiUrl ?? '').replace(/\/+$/, '');
  private readonly baseUrl = `${this.apiBase}/superadmin/admins`;

  constructor(private http: HttpClient) {}

  // GET /superadmin/admins
  getAdmins(perPage = 20, page = 1): Observable<AdminsListResponse> {
    const params = new HttpParams()
      .set('perPage', String(perPage))
      .set('page', String(page));

    return this.http.get<AdminsListResponse>(this.baseUrl, { params });
  }

  // GET /superadmin/admins/{id}
  getAdmin(id: number): Observable<{ user: SuperadminAdminDto }> {
    return this.http.get<{ user: SuperadminAdminDto }>(`${this.baseUrl}/${id}`);
  }

  // POST /superadmin/admins
  createAdmin(payload: CreateAdminPayload): Observable<SuperadminAdminDto> {
    return this.http.post<SuperadminAdminDto>(this.baseUrl, payload);
  }

  // PATCH /superadmin/admins/{id}
  updateAdmin(id: number, payload: UpdateAdminPayload): Observable<SuperadminAdminDto> {
    return this.http.patch<SuperadminAdminDto>(`${this.baseUrl}/${id}`, payload);
  }

  // DELETE /superadmin/admins/{id}
  deleteAdmin(id: number): Observable<{ status: true }> {
    return this.http.delete<{ status: true }>(`${this.baseUrl}/${id}`);
  }
}

