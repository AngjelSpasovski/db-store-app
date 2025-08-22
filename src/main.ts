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

ModuleRegistry.registerModules([ AllCommunityModule ]);

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
  ]
}).catch(err => console.error(err));
