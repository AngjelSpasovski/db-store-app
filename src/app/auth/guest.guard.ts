// src/app/auth/guest.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

export const guestGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // ако има токен -> guest не смее да гледа /login
  const token = auth.token;
  if (!token) return true;

  const u = auth.getCurrentUser(); // чита од storage
  const role = (u?.role || 'user').toLowerCase();

  const target =
    role === 'superadmin' ? '/admin' :
    /* adminuser + user */ '/user/buy-credits';

  // (опционално) анти-loop ако некако веќе е на target:
  if (state.url.startsWith(target)) return true;

  return router.createUrlTree([target]);
};
