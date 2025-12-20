// src/app/auth/superadmin.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SuperadminGuard {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const u = this.auth.getCurrentUser();
    if (u?.role?.toLowerCase() === 'superadmin') return true;

    // ✅ НЕ navigate() во guard — врати UrlTree
    return this.router.createUrlTree(['/login'], { queryParams: { tab: 'login' } });
  }
}

// functional style:
export const superadminGuard: CanActivateFn = () => {
  const svc = inject(SuperadminGuard);
  return svc.canActivate();
};

export const superadminCanMatch: CanMatchFn = () => {
  const svc = inject(SuperadminGuard);
  return svc.canActivate();
};
