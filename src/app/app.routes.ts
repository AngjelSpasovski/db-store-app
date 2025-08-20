// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';

export const appRoutes: Routes = [
  { path: '',                 redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',             loadComponent: () => import('./home/home.page').then(m => m.HomePage) },
  { path: 'login',            loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'confirm-email',    loadComponent: () => import('./auth/login/confirm-email/confirm-email.component').then(m => m.ConfirmEmailComponent) },
  { path: 'forgot-password',  loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password',   loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },

  // private routes that require authentication
  { path: 'user',             loadChildren:  () => import('./user/user.module').then(m => m.UserModule),    canActivate: [authGuard]},  // ⬅️ само проверка дека е логираниот

  // top-level admin routes
  // {
  //   path: 'admin',
  //   canActivate: [authGuard, roleGuard],
  //   data: { roles: ['admin'] },
  //   loadComponent: () => import('./admin/admin.page').then(m => m.AdminPage),
  // },

  { path: '**', redirectTo: 'home' },
];
