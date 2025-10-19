// src/app/auth/admin-email.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

export const adminEmailGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // ако користиш BehaviorSubject во AuthService:
  const u = auth.currentUser$?.value ?? null;
  const isLoggedIn = !!u;
  const email = (u?.email ?? '').toLowerCase();

  const allowed = isLoggedIn && email === 'angjel.spasovski@gmail.com';
  return allowed ? true : (router.createUrlTree([isLoggedIn ? '/user' : '/login']) as UrlTree);
};
