import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../auth/auth.environment';
import { catchError, map, of } from 'rxjs';

export interface User {
    id: number | string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    role: 'user' | 'admin' | 'superadmin';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateMeReq {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  password?: string;
}

export interface Package { id: number; name: string; description: string; credits: number; price: number; discountPercentage: number; isActive: boolean; createdAt: string; updatedAt: string; }
export interface UserPackage { id: number; userId: number; packageId: number; package: Package; creditsRemaining: number; expiresAt: string; createdAt: string; updatedAt: string; }

export interface BillingDetails {
    id: number; userId: number; email: string; companyName: string;
    address1: string; address2?: string; buildingNumber?: string;
    zipcode: string; city: string; stateCode: string; nation: string;
    vatNumber: string; createdAt: string; updatedAt: string;
}

export interface UserDetailsDTO {
    user: User;
    userPackages: UserPackage[];
    creditUsages: { id: number; userId: number; credits: number; createdAt: string; updatedAt: string }[];
    transactions: { id: number; userId: number; packageId: number; amount: number; createdAt: string; updatedAt: string }[];
    billingDetails: BillingDetails | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
    private base = (environment.baseApiUrl ?? '/api').replace(/\/+$/, '');
    constructor(private http: HttpClient) { }

    getMeDetails() {
        return this.http.get<UserDetailsDTO>(`${this.base}/users/me/details`);
    }

    getCredits() {
        return this.http.get<{ credits: number }>(`${this.base}/users/me/credits`)
            .pipe(catchError(() => of({ credits: 0 })));
    }

    /** Edit profile (first/last/company + optional password) */
    updateMe(payload: UpdateMeReq) {
        return this.http.patch<User>(`${this.base}/users/me`, payload);
    }
}
