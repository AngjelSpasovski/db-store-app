// src/app/auth/role.guard.ts
import { CanActivateFn, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/toast.service';

type Role = 'user' | 'adminuser' | 'superadmin';

const RANK: Record<Role, number> = { user: 1, adminuser: 2, superadmin: 3 };

function normRole(r: any): Role {
  const v = String(r || 'user').toLowerCase();
  if (v === 'admin_user' || v === 'adminuser' || v === 'admin') return 'adminuser';
  if (v === 'superadmin') return 'superadmin';
  return 'user';
}

function roleAllows(expected: string[] | undefined, actual: Role): boolean {
  if (!expected || expected.length === 0) return true;

  const expectedNorm = expected.map(normRole);
  const minRank = Math.min(...expectedNorm.map(r => RANK[r]));
  return RANK[actual] >= minRank;
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
  const email = (u?.email || '').toLowerCase();

  // whitelist супер-админ (ако сакаш да остане вака)
  //if (email === 'angjel.spasovski@gmail.com' && state.url.startsWith('/admin')) return true;

  const userRole = normRole(u?.role);
  const expected = (route.data?.['roles'] as string[] | undefined) ?? [];

  if (roleAllows(expected, userRole)) return true;

  toast.show('You don’t have permission to view that page.', false, 3500, 'top-end');

  // ✅ анти-loop: ако веќе си на fallback страната, пушти (инаку ќе се врти бесконечно)
  const fallback = (userRole === 'superadmin') ? '/admin' : '/user/buy-credits';
  if (state.url.startsWith(fallback)) return true;

  return router.createUrlTree([fallback]);
};
