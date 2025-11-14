// src/app/auth/superadmin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SuperadminGuard  {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const u = this.auth.getCurrentUser();
    if (u?.role?.toLowerCase() === 'superadmin') return true;

    this.router.navigate(['/login'], { queryParams: { tab: 'login' } });

    return false;
  }
}

// ако сакаш функционален стил:
export const superadminGuard: CanActivateFn = () => {
  const svc = inject(SuperadminGuard);
  return svc.canActivate();
};

//
export const superadminCanMatch: CanMatchFn = () => {
  const svc = inject(SuperadminGuard);
  return svc.canActivate();
};
