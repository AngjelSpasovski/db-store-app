// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';
import { guestGuard } from './auth/guest.guard';
import { superadminCanMatch, superadminGuard } from './auth/superadmin.guard';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'account', redirectTo: 'user/account', pathMatch: 'full' },

  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    data: { title: 'HOME' }
  },

  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    data: { title: 'LOGIN' }
  },

  {
    path: 'confirm-email',
    loadComponent: () => import('./auth/login/confirm-email/confirm-email.component').then(m => m.ConfirmEmailComponent),
    data: { title: 'CONFIRM_EMAIL' }
  },

  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: { title: 'FORGOT_PASSWORD' }
  },

  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    data: { title: 'RESET_PASSWORD' }
  },

  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['user', 'adminuser', 'superadmin'],
      title: 'USER'
    }
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    // ✅ adminuser + superadmin имаат пристап до admin API/UI
    data: { roles: ['adminuser', 'superadmin'], title: 'ADMIN' },
    loadComponent: () => import('./admin/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        data: { title: { prefix: 'Admin', main: 'Dashboard' } }
      },
      {
        path: 'user-details',
        loadComponent: () => import('./admin/user-details/user-details.component').then(m => m.AdminUserDetailsComponent),
        data: { title: { prefix: 'Admin', main: 'User Details' } }
      },
      {
        path: 'billing-users',
        loadComponent: () => import('./admin/billing-users/billing-users.component').then(m => m.AdminBillingUsersComponent),
        data: { title: { prefix: 'Admin', main: 'Billing by Users' } }
      },
      {
        path: 'package-management',
        loadComponent: () => import('./admin/package-management/package-management.component').then(m => m.AdminPackageManagementComponent),
        data: { title: { prefix: 'Admin', main: 'Package Management' } }
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/users-list/users-list.component').then(m => m.AdminUsersListComponent),
        data: { title: { prefix: 'Admin', main: 'Users' } }
      },
    ]
  },

  {
    path: 'superadmin',
    canMatch: [superadminCanMatch],
    canActivate: [superadminGuard],
    children: [
      { path: 'packages', loadComponent: () => import('./superadmin/packages/packages.component').then(m => m.PackagesComponent) },
      { path: 'admins',   loadComponent: () => import('./superadmin/admins/admins.component').then(m => m.AdminsComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'packages' }
    ]
  },

  { path: '**', redirectTo: 'home' },
];
