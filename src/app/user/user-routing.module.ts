// src/app/user/user-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserComponent } from './user.component';
import { BuyCreditsComponent } from './buy-credits/buy-credits.component';
import { NewResearchComponent } from './new-research/new-research.component';
import { HistoryComponent } from './history/history.component';
import { BillingComponent } from './billing/billing.component';
import { FaqsComponent } from './faqs/faqs.component';
import { PrivacyPolicyComponent } from './PRIVACY/privacy-policy/privacy-policy.component';
import { TermsComponent } from './PRIVACY/terms/terms.component';
import { CookiesPolicyComponent } from './PRIVACY/cookies-policy/cookies-policy.component';
import { RefundPolicyComponent } from './PRIVACY/refund-policy/refund-policy.component';
import { ServiceDeliveryPolicyComponent } from './PRIVACY/service-delivery-policy/service-delivery-policy.component';
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
      { path: 'buy-credits',              component: BuyCreditsComponent,   data: { title: 'BUY_CREDITS' } },
      { path: 'new-research',             component: NewResearchComponent,  data: { title: 'NEW_RESEARCH' } },
      { path: 'history',                  component: HistoryComponent,      data: { title: 'HISTORY' } },
      { path: 'billing',                  component: BillingComponent,      data: { title: 'BILLING' } },
      { path: 'faqs',                     component: FaqsComponent,         data: { title: 'FAQS' } },

      // Privacy pages (обично јавни, ама ако сакаш да останат внатре – исто ги покрива горниот roles сет)
      { path: 'privacy-policy',          component: PrivacyPolicyComponent,          data: { title: 'PRIVACY_POLICY' } },
      { path: 'terms',                   component: TermsComponent,                  data: { title: 'TERMS_AND_CONDITIONS' } },
      { path: 'cookies-policy',          component: CookiesPolicyComponent,          data: { title: 'COOKIES' } },
      { path: 'refund-policy',           component: RefundPolicyComponent,           data: { title: 'REFUND_POLICY' } },
      { path: 'service-delivery-policy', component: ServiceDeliveryPolicyComponent,  data: { title: 'SERVICE_DELIVERY_POLICY' } },

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
