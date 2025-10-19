import { Component, OnInit, ViewChild   } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
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

  public currentView: 'home' | 'login' | 'forgot-password' |'reset-password' | 'user' | 'admin' = 'home';
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
    private language: LanguageService
  ) {
    // Set default language for ngx-translate
    this.translate.setDefaultLang('en'); 

    // init snapshot
    this.currentView = this.mapUrl(this.router.url);
    this.isLoggedIn  = !!this.authService.currentUser$.value;
    this.userEmail   = this.authService.getLoggedInUserEmail() || '';

    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        this.currentView = this.mapUrl(ev.urlAfterRedirects);
        this.isLoggedIn  = !!this.authService.currentUser$.value;
        this.userEmail   = this.authService.getLoggedInUserEmail() || '';
      }
    });

  }

  ngAfterViewInit(): void {}

  ngOnInit(): void {

    const saved = localStorage.getItem('selectedLanguage') || 'en';
    this.languageService.set(saved);                                  // Set initial language from localStorage or default to 'en'

    // Register event listeners for online/offline status
    window.addEventListener('offline', this.onOffline);
    window.addEventListener('online',  this.onOnline);

    // Initialize app titles
    this.appTitle.init();

    // Check if user is logged in
    this.isLoggedIn = !!this.authService.currentUser$.value;

    // Subscribe to auth state changes
    this.authService.isAuthed$.subscribe(v => this.isLoggedIn = v);

    // Check initial online status
    if (!navigator.onLine) this.onOffline();

    // Subscribe to language changes and apply them globally
    this.languageService.language$.subscribe((lang: any) => {
      console.log('🌍 Language changed to:', lang);
    });

    // check if user is logged in
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
      console.log('Logged-in user detected:', loggedInUser);
      this.isLoggedIn = true;       // set isLoggedIn to true, showing logout modal
    }
    else {
      console.log('No logged-in user found');
      this.isLoggedIn = false;      // set isLoggedIn to false, not showing logout modal
    }

  }

  ngOnDestroy() {
    // Clean up event listeners
    window.removeEventListener('offline', this.onOffline);
    window.removeEventListener('online',  this.onOnline);
  }

  private mapUrl(url: string): typeof this.currentView {
    if (url.includes('/login')) return 'login';
    if (url.includes('/forgot-password')) return 'forgot-password';
    if (url.includes('/reset-password')) return 'reset-password';
    if (url.includes('/admin')) return 'admin';
    if (url.includes('/user')) return 'user';
    return 'home';
  }

  // Handle logout confirmation
  private onOffline = () => this.toast.show(this.translate.instant('NETWORK_ERROR'), false, 4000, 'top-end');
  private onOnline = () => this.toast.show(this.translate.instant('BACK_ONLINE') || 'Back online.', true, 2000, 'top-end');


  handleLogout() {
    console.log('User chose to log out');
    this.authService.logout();
  }
}
