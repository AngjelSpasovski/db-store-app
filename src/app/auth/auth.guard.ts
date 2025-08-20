// src/app/auth/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const token = localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token');
  
  if (token) return true;

  return inject(Router).createUrlTree(
    ['/login'],
    { queryParams: { tab: 'login', redirect: state.url } }
  );
};
