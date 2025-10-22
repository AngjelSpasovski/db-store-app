// src/app/user/user.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutingModule } from './user-routing.module';
import { ReactiveFormsModule } from '@angular/forms';

// API implementations
import { CREDITS_API, BILLING_API } from '../shared/tokens.api';
import { LocalCreditsApi } from '../shared/local-credits.api';
import { LocalBillingApi } from '../shared/local-billing.api';

// http implementations
import { HttpCreditsApi } from '../shared/http-credits.api';
import { HttpBillingApi } from '../shared/http-billing.api';

// Standalone components
import { UserComponent } from './user.component';
import { SidebarComponent } from './side-bar/side-bar.component';
import { HeaderInComponent } from './header-in/header-in.component';
import { GlobalFooterComponent } from './global-footer/global-footer.component';
import { BuyCreditsComponent } from './buy-credits/buy-credits.component';
import { NewResearchComponent } from './new-research/new-research.component';
import { HistoryComponent } from './history/history.component';
import { BillingComponent } from './billing/billing.component';
import { FaqsComponent } from './faqs/faqs.component';

import { AccountComponent } from './account/account.component';
import { environment } from 'src/environments/environment';

const creditsProvider = environment.dataMode === 'api'
  ? { provide: CREDITS_API, useExisting: HttpCreditsApi }
  : { provide: CREDITS_API, useExisting: LocalCreditsApi };

const billingProvider = environment.dataMode === 'api'
  ? { provide: BILLING_API, useExisting: HttpBillingApi }
  : { provide: BILLING_API, useExisting: LocalBillingApi };

@NgModule({
  imports: [
    CommonModule,
    UserRoutingModule,
    ReactiveFormsModule,

    // ← Import standalone components here
    UserComponent,
    SidebarComponent,
    HeaderInComponent,
    GlobalFooterComponent,
    BuyCreditsComponent,
    NewResearchComponent,
    HistoryComponent,
    BillingComponent,
    FaqsComponent,
    AccountComponent   
  ],
  providers: [creditsProvider, billingProvider]
})
export class UserModule {}
