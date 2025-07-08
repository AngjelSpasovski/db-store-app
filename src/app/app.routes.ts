import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '',                 redirectTo: 'home',       pathMatch: 'full' },
  { path: 'login',            loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'forgot-password',  loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'home',             loadComponent: () => import('./home/home.page').then(m => m.HomePage) },
  { path: 'user',             loadChildren: () => import('./user/user.module').then(m => m.UserModule) }
];