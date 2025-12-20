import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd, RouterModule } from '@angular/router';

import { AuthService } from './auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './HTMLHelpers/language-selector/language.service';
import { HeaderComponent } from './HTMLHelpers/header/header.component';

import { LoadingBarComponent } from './shared/loading-bar.component';
import { ToastService } from '../app/shared/toast.service';
import { AppTitleService } from './shared/app-title.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeaderComponent,
    RouterModule,
    LoadingBarComponent
  ]
})
export class AppComponent implements OnInit {

  public currentView: 'home' | 'login' | 'forgot-password' | 'reset-password' | 'user' | 'admin' = 'home';
  public userEmail: string = '';
  public isLoggedIn: boolean = false;

  public showLogoutModal = false;

  constructor(
    public authService: AuthService,
    private translate: TranslateService,
    private languageService: LanguageService,
    private router: Router,
    private toast: ToastService,
    private appTitle: AppTitleService,
  ) {
    // Default language
    this.translate.setDefaultLang('it');

    // init snapshot
    this.currentView = this.mapUrl(this.router.url);
    this.isLoggedIn  = this.authService.isAuthed$.value;
    this.userEmail   = this.authService.getLoggedInUserEmail() || '';

    // update view mode on navigation
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        this.currentView = this.mapUrl(ev.urlAfterRedirects);
      }
    });

    // auth state = single source of truth
    this.authService.isAuthed$.subscribe(v => {
      this.isLoggedIn = v;
    });

    // keep email in sync
    this.authService.currentUser$.subscribe(u => {
      this.userEmail = u?.email || '';
    });
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('selectedLanguage') || 'en';
    this.languageService.set(saved);

    // online/offline listeners
    window.addEventListener('offline', this.onOffline);
    window.addEventListener('online',  this.onOnline);

    // init titles
    this.appTitle.init();

    // initial online status
    if (!navigator.onLine) this.onOffline();

    // optional: log language changes
    this.languageService.language$.subscribe((lang: any) => {
      console.log('🌍 Language changed to:', lang);
    });

    // ✅ IMPORTANT: removed legacy "loggedInUser" session flag
    // We rely ONLY on AuthService (auth_token/auth_user + isAuthed$).
  }

  ngOnDestroy() {
    window.removeEventListener('offline', this.onOffline);
    window.removeEventListener('online',  this.onOnline);
  }

  private mapUrl(url: string): typeof this.currentView {
    if (url.includes('/login')) return 'login';
    if (url.includes('/forgot-password')) return 'forgot-password';
    if (url.includes('/reset-password')) return 'reset-password';

    // ✅ superadmin routes are part of admin experience/layout
    if (url.includes('/superadmin') || url.includes('/admin')) return 'admin';

    if (url.includes('/user')) return 'user';
    return 'home';
  }

  private onOffline = () =>
    this.toast.show(this.translate.instant('NETWORK_ERROR'), false, 4000, 'top-end');

  private onOnline = () =>
    this.toast.show(this.translate.instant('BACK_ONLINE') || 'Back online.', true, 2000, 'top-end');

  handleLogout() {
    this.authService.logout();
  }
}
