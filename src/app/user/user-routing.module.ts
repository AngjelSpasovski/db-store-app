// src/app/user/user-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserComponent } from './user.component';
import { BuyCreditsComponent } from './buy-credits/buy-credits.component';
import { NewResearchComponent } from './new-research/new-research.component';
import { HistoryComponent } from './history/history.component';
import { BillingComponent } from './billing/billing.component';
import { FaqsComponent } from './faqs/faqs.component';

import { DocumentViewerComponent } from './document-viewer/document-viewer.component';

import { AccountComponent } from './account/account.component';
import { roleGuard } from '../auth/role.guard';


const routes: Routes = [
  {
    path: '',
    component: UserComponent,
    canActivateChild: [roleGuard],
    data: { roles: ['user', 'adminUser','superadmin'] }, // ⬅️ сите имаат пристап до основните user рути
    children: [
      { path: '', redirectTo: 'buy-credits', pathMatch: 'full' },

      // Основни рути – достапни за сите улоги
      { path: 'buy-credits',              component: BuyCreditsComponent,     data: { title: 'BUY_CREDITS' } },
      { path: 'new-research',             component: NewResearchComponent,    data: { title: 'NEW_RESEARCH' } },
      { path: 'history',                  component: HistoryComponent,        data: { title: 'HISTORY' } },
      { path: 'billing',                  component: BillingComponent,        data: { title: 'BILLING' } },
      { path: 'faqs',                     component: FaqsComponent,           data: { title: 'FAQS' } },

      // Privacy pages – сите на иста компонента
      { path: 'privacy-policy',           component: DocumentViewerComponent, data: { title: 'PRIVACY_POLICY', docType: 'privacy-policy' } },
      { path: 'terms',                    component: DocumentViewerComponent, data: { title: 'TERMS_AND_CONDITIONS', docType: 'terms' } },
      { path: 'cookies-policy',           component: DocumentViewerComponent, data: { title: 'COOKIES_POLICY', docType: 'cookies' } },
      { path: 'refund-policy',            component: DocumentViewerComponent, data: { title: 'REFUND_POLICY', docType: 'refund-policy' } },
      { path: 'service-delivery-policy',  component: DocumentViewerComponent, data: { title: 'SERVICE_DELIVERY_POLICY', docType: 'service-delivery-policy' } },

      // account page
      { path: 'account',                 component: AccountComponent,                data: { title: 'ACCOUNT',        roles: ['user','adminUser','superadmin'] } },

      // ⬇️ Пример за admin-only подоцна:
      // { path: 'admin',                 component: AdminDashboardComponent,     canActivate: [roleGuard], data: { roles: ['admin','superadmin'] } },

      // ⬇️ Пример за superadmin-only:
      // { path: 'superadmin',            component: SuperAdminComponent,         canActivate: [roleGuard], data: { roles: ['superadmin'] } },

      { path: '**', redirectTo: 'buy-credits' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule {}
