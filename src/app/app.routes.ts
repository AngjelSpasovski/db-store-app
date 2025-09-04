// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';

export const appRoutes: Routes = [
  { path: '',               redirectTo: 'home', pathMatch: 'full' },
  { path: 'account',        redirectTo: 'user/account', pathMatch: 'full' },

  { path: 'home',            loadComponent: () => import('./home/home.page').then(m => m.HomePage),                                                 data: { title: 'HOME' } },
  { path: 'login',           loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),                               data: { title: 'LOGIN' } },
  { path: 'confirm-email',   loadComponent: () => import('./auth/login/confirm-email/confirm-email.component').then(m => m.ConfirmEmailComponent),  data: { title: 'CONFIRM_EMAIL' } },
  { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),  data: { title: 'FORGOT_PASSWORD' } },
  { path: 'reset-password',  loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),     data: { title: 'RESET_PASSWORD' } },

  { path: 'user',            loadChildren:  () => import('./user/user.module').then(m => m.UserModule),    canActivate: [authGuard, roleGuard],     data: { roles: ['user','admin','superadmin'], title: 'USER' }  },

  { path: '**', redirectTo: 'home' },
];
