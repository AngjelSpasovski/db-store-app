import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutingModule } from './user-routing.module';

// Standalone components
import { UserComponent } from './user.component';
// import { SidebarComponent } from './sidebar/sidebar.component';
// import { FooterComponent } from './footer/footer.component';
// import { BuyCreditsComponent } from './buy-credits/buy-credits.component';
// import { NewResearchComponent } from './new-research/new-research.component';
// import { HistoryComponent } from './history/history.component';
// import { BillingComponent } from './billing/billing.component';
// import { FaqsComponent } from './faqs/faqs.component';

@NgModule({
  imports: [
    CommonModule,
    UserRoutingModule,

    // ← Import standalone components here
    UserComponent,
    // SidebarComponent,
    // FooterComponent,
    // BuyCreditsComponent,
    // NewResearchComponent,
    // HistoryComponent,
    // BillingComponent,
    // FaqsComponent
  ]
})
export class UserModule {}
