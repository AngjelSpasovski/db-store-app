import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserComponent } from './user.component';
import { BuyCreditsComponent } from './buy-credits/buy-credits.component';
import { NewResearchComponent } from './new-research/new-research.component';
import { HistoryComponent } from './history/history.component';
import { BillingComponent } from './billing/billing.component';
import { FaqsComponent } from './faqs/faqs.component';
// import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
// import { TermsComponent } from './terms/terms.component';
// import { CookiesPolicyComponent } from './cookies-policy/cookies-policy.component';
// import { RefundPolicyComponent } from './refund-policy/refund-policy.component';
// import { ServiceDeliveryPolicyComponent } from './service-delivery-policy/service-delivery-policy.component';

const routes: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
        { path: '',     redirectTo: 'buy-credits',   pathMatch: 'full' },
        { path: 'buy-credits',              component: BuyCreditsComponent,               data: { title: 'BUY_CREDITS' } },
        { path: 'new-research',             component: NewResearchComponent,              data: { title: 'NEW_RESEARCH' } },
        { path: 'history',                  component: HistoryComponent,                  data: { title: 'HISTORY' } },
        { path: 'billing',                  component: BillingComponent,                  data: { title: 'BILLING' } },
        { path: 'faqs',                     component: FaqsComponent,                     data: { title: 'FAQS' } },
    //   { path: 'privacy-policy',           component: PrivacyPolicyComponent },
    //   { path: 'terms',                    component: TermsComponent },
    //   { path: 'cookies-policy',           component: CookiesPolicyComponent },
    //   { path: 'refund-policy',            component: RefundPolicyComponent },
    //   { path: 'service-delivery-policy',  component: ServiceDeliveryPolicyComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule {}