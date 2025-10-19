// src/app/auth/guest.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const u = auth.currentUser$?.value || null;
  if (!u || !auth.token) return true; // не-логираn → дозволи /login

  const email = (u.email || '').toLowerCase();
  if (email === 'angjel.spasovski@gmail.com') {
    return router.createUrlTree(['/admin']) as UrlTree;
  }

  const role = (u.role || 'user').toLowerCase();
  const target =
    role === 'superadmin' ? '/user/superadmin' :
    role === 'admin'      ? '/user/admin'      :
                            '/user/buy-credits';
  return router.createUrlTree([target]) as UrlTree;
};
