// main.ts
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

import { provideRouter } from '@angular/router';
import { appRoutes } from './app/app.routes';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideTranslateLoader } from './translate.providers';   // 👈 if there  is a configuration for ngx-translate

import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';


import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoadingInterceptor } from './app/shared/loading.interceptor.service';
import { AuthInterceptor } from './app/auth/auth.interceptor';

import { CREDITS_API, BILLING_API } from './app/shared/tokens.api';
import { HttpCreditsApi } from './app/shared/http-credits.api';
import { LocalCreditsApi } from './app/shared/local-credits.api';
import { HttpBillingApi } from './app/shared/http-billing.api';
import { LocalBillingApi } from './app/shared/local-billing.api';

ModuleRegistry.registerModules([ AllCommunityModule ]);


const creditsProvider = environment.dataMode === 'api'
  ? { provide: CREDITS_API, useExisting: HttpCreditsApi }
  : { provide: CREDITS_API, useExisting: LocalCreditsApi };

const billingProvider = environment.dataMode === 'api'
  ? { provide: BILLING_API, useExisting: HttpBillingApi }
  : { provide: BILLING_API, useExisting: LocalBillingApi };


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    provideIonicAngular(),
    provideAnimations(),
    provideTranslateLoader(),                                       // 👈 if there  is a configuration for ngx-translate

    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,   multi: true },

    creditsProvider,
    billingProvider,
  ]
}).catch(err => console.error(err));
