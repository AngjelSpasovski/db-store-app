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

const routes: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
      // Redirect root user path to buy-credits
      { path: '',     redirectTo: 'buy-credits',   pathMatch: 'full' },

      // Main user routes
      { path: 'buy-credits',              component: BuyCreditsComponent,               data: { title: 'BUY_CREDITS' } },
      { path: 'new-research',             component: NewResearchComponent,              data: { title: 'NEW_RESEARCH' } },
      { path: 'history',                  component: HistoryComponent,                  data: { title: 'HISTORY' } },
      { path: 'billing',                  component: BillingComponent,                  data: { title: 'BILLING' } },
      { path: 'faqs',                     component: FaqsComponent,                     data: { title: 'FAQS' } },

      // Privacy and legal pages
      { path: 'privacy-policy',           component: PrivacyPolicyComponent },
      { path: 'terms',                    component: TermsComponent },
      { path: 'cookies-policy',           component: CookiesPolicyComponent },
      { path: 'refund-policy',            component: RefundPolicyComponent },
      { path: 'service-delivery-policy',  component: ServiceDeliveryPolicyComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule {}