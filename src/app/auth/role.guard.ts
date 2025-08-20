// src/app/auth/role.guard.ts
import { CanActivateFn, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
// ВНИМ: усогласи ја патеката за ToastService со твојата структура
import { ToastService } from '../shared/toast.service';

type Role = 'user' | 'admin' | 'superadmin';

const RANK: Record<Role, number> = { user: 1, admin: 2, superadmin: 3 };

function roleAllows(expected: string[] | undefined, actual: string | undefined): boolean {
  if (!expected || expected.length === 0) return true;        // ако нема roles на рутата → пушти
  const act = (actual || '').toLowerCase() as Role;
  if (!RANK[act]) return false;

  // хијерархија: superadmin >= admin >= user
  const expectedLC = expected.map(r => r.toLowerCase()) as Role[];
  const minRank = Math.min(...expectedLC.map(r => RANK[r] ?? Number.POSITIVE_INFINITY));
  return RANK[act] >= minRank;
}

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state): boolean | UrlTree => {
  const router = inject(Router);
  const auth   = inject(AuthService);
  const toast  = inject(ToastService);

  // 1) мора да е логирано
  const token = auth.token || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (!token) {
    // Опционален toast – ако сакаш да е потивко, избриши ја оваа линија:
    toast.show('Please sign in to continue.', false, 3500, 'top-end');
    return router.createUrlTree(['/login'], { queryParams: { tab: 'login', redirect: state.url } });
  }

  // 2) прочитај ја улогата од currentUser$ (seed-нат од storage на старт)
  const userRole = auth.currentUser$.value?.role;

  // 3) дозвола според roles во рутата (ги читаме од најблискиот сегмент)
  const expected = (route.data?.['roles'] as string[] | undefined) ?? [];

  if (roleAllows(expected, userRole)) return true;

  // 4) нема дозвола → тивок redirect (или со toast, по желба)
  toast.show('You don’t have permission to view that page.', false, 3500, 'top-end');
  return router.createUrlTree(['/home']);
};
