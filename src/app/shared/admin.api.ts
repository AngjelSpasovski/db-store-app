// src/app/shared/admin.api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../auth/auth.environment';

export interface AdminUserRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  role: 'user'|'adminUser'|'superadmin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackageRow {
  id: number;
  name: string;
  description?: string;
  price: number;
  credits: number;
  durationDays: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  password: string;
}

export type CreatePackageDto = Omit<PackageRow, 'id'|'createdAt'|'updatedAt'>;

export interface Paged<T> { list: T[]; total: number; }

@Injectable({ providedIn: 'root' })
export class AdminApi {

  private api = (environment.baseApiUrl ?? '').replace(/\/+$/, ''); // '/api/v1'

  constructor(private http: HttpClient) {}

  // ADMIN & SUPERADMIN ====================================================================
  // LIST
  listUsers(perPage = 10, page = 1) {
    const params = new HttpParams()
      .set('perPage', String(perPage))
      .set('page', String(page));
    return this.http.get<Paged<AdminUserRow>>(`${this.api}/admin/users`, { params });
  }
  // GET
  getUser(id: number) {
    return this.http.get(`${this.api}/admin/users/${id}`);
  }
  // PATCH
  patchUserStatus(id: number, inactive: boolean) {
    return this.http.patch(`${this.api}/admin/users/${id}/status`, { inactive });
  }
  // GET
  getBillingDetails(id: number) {
    return this.http.get(`${this.api}/admin/users/${id}/billing-details`);
  }
  // PATCH
  patchBillingDetails(id: number, body: any) {
    return this.http.patch(`${this.api}/admin/users/${id}/billing-details`, body);
  }
  // GET
  getMainDataByPhone(query: { phone?: string; user?: string }) {
    return this.http.get(`${this.api}/admin/main-data-by-phone`, { params: query as any });
  }
  // PATCH
  confirmInvoice(id: number) {
    return this.http.patch(`${this.api}/admin/invoices/${id}/confirm`, {});
  }

// SUPERADMIN ONLY ======================================================================
// LIST
listAdmins(perPage = 20, page = 1) {
  const params = new HttpParams().set('perPage', String(perPage)).set('page', String(page));
  return this.http.get<Paged<AdminRow>>(`${this.api}/superadmin/admins`, { params });
}
// CREATE
createAdmin(body: {
  firstName: string; lastName: string; email: string; companyName?: string; isActive?: boolean;
}) {
  return this.http.post<{ admin: AdminRow }>(`${this.api}/superadmin/admins`, body);
}
// GET
getAdmin(id: number) {
  return this.http.get<{ admin: AdminRow }>(`${this.api}/superadmin/admins/${id}`);
}
// PATCH
patchAdmin(id: number, body: Partial<{
  firstName: string; lastName: string; email: string; companyName: string; isActive: boolean;
}>) {
  return this.http.patch<{ admin: AdminRow }>(`${this.api}/superadmin/admins/${id}`, body);
}
// DELETE
deleteAdmin(id: number) {
  return this.http.delete<{ status: boolean }>(`${this.api}/superadmin/admins/${id}`);
}


  // Superadmin › Packages ==================================================================
  // LIST
  listPackages(perPage = 50, page = 1) {
    const params = new HttpParams()
      .set('perPage', String(perPage))
      .set('page', String(page));
    return this.http.get<Paged<PackageRow>>(`${this.api}/superadmin/packages`, { params });
  }
  // CREATE
  createPackage(body: CreatePackageDto) {
    return this.http.post<{ package: PackageRow }>(`${this.api}/superadmin/packages`, body);
  }
  // PATCH
  patchPackage(id: number, body: Partial<CreatePackageDto>) {
    return this.http.patch<{ package: PackageRow }>(`${this.api}/superadmin/packages/${id}`, body);
  }

  // Superadmin › Users › Packages ==========================================================
  // POST
  assignUserPackage(userId:number, body:any){
    return this.http.post(`${this.api}/superadmin/users/${userId}/packages`, body);
  }
  // DELETE
  deleteUserPackage(userId:number, userPackageId:number){
    return this.http.delete(`${this.api}/superadmin/users/${userId}/packages/${userPackageId}`);
  }


}



