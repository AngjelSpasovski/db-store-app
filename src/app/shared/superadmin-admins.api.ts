// src/app/shared/superadmin-admin.api.ts
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
  isActive?: boolean;
}

export interface UpdateAdminPayload {
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class SuperadminAdminsApi {
  private readonly baseUrl = `${environment.baseApiUrl}/superadmin/admins`;

  constructor(private http: HttpClient) {}

  getAdmins(perPage = 20, page = 1): Observable<AdminsListResponse> {
    const params = new HttpParams()
      .set('perPage', String(perPage))
      .set('page', String(page));

    return this.http.get<AdminsListResponse>(this.baseUrl, { params });
  }

  createAdmin(payload: CreateAdminPayload): Observable<{ user: SuperadminAdminDto }> {
    return this.http.post<{ user: SuperadminAdminDto }>(this.baseUrl, payload);
  }

  updateAdmin(id: number, payload: UpdateAdminPayload): Observable<{ user: SuperadminAdminDto }> {
    return this.http.patch<{ user: SuperadminAdminDto }>(`${this.baseUrl}/${id}`, payload);
  }

  deleteAdmin(id: number): Observable<{ status: true }> {
    return this.http.delete<{ status: true }>(`${this.baseUrl}/${id}`);
  }
}
