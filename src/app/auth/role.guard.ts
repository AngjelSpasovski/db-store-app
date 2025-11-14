// src/app/auth/role.guard.ts
import { CanActivateFn, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/toast.service';

type Role = 'user' | 'adminUser' | 'superadmin';

const RANK: Record<Role, number> = { user: 1, adminUser: 2, superadmin: 3 };

function roleAllows(expected: string[] | undefined, actual: string | undefined): boolean {
  if (!expected || expected.length === 0) return true;

  const act = (actual || '').toLowerCase() as Role;
  if (!RANK[act]) return false;

  const expectedLC = expected.map(r => r.toLowerCase()) as Role[];
  const minRank = Math.min(...expectedLC.map(r => RANK[r] ?? Number.POSITIVE_INFINITY));

  return RANK[act] >= minRank;
}

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state): boolean | UrlTree => {
  const router = inject(Router);
  const auth   = inject(AuthService);
  const toast  = inject(ToastService);

  const token = auth.token || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (!token) {
    toast.show('Please sign in to continue.', false, 3500, 'top-end');
    return router.createUrlTree(['/login'], { queryParams: { tab: 'login', redirect: state.url } });
  }

  const u = auth.getCurrentUser() || auth.currentUser$.value;
  const userRole = (u?.role || 'user').toLowerCase();
  const expected = (route.data?.['roles'] as string[] | undefined) ?? [];

  const email = (u?.email || '').toLowerCase();
  // ако си whitelist супер админ → дозволи пристап до /admin без да гледаме roles
  if (email === 'angjel.spasovski@gmail.com' && state.url.startsWith('/admin')) {
    return true;
  }

  if (roleAllows(expected, userRole)) return true;

  toast.show('You don’t have permission to view that page.', false, 3500, 'top-end');

  // fallback „дом“ според улога
  const r = (userRole || 'user').toLowerCase();
  return (userRole === 'superadmin')
    ? router.createUrlTree(['/admin'])
    : router.createUrlTree(['/user/buy-credits']);
};
