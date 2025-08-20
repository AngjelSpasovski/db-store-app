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

  public currentView: 'home' | 'login' | 'forgot-password' | 'user' = 'home';
  public userEmail: string = '';
  public isLoggedIn: boolean = false;

  public showLogoutModal = false;

  constructor(
    public authService: AuthService,
    private translate: TranslateService,
    private languageService: LanguageService,
    private router: Router
  ) {
    this.translate.setDefaultLang('en'); // Set default language

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;

        if (url.includes('/login')) {
          this.currentView = 'login';
        }
        else if (url.includes('/forgot-password')) {
          this.currentView = 'forgot-password';
        }
        else if (url.includes('/user')) {
          this.currentView = 'user';
        }
        else {
          this.currentView = 'home';
        }

        this.isLoggedIn = this.authService.isLoggedIn;
        this.userEmail = this.authService.getLoggedInUserEmail() || '';
      }
    });

  }

  ngAfterViewInit(): void {}

  ngOnInit(): void {

    // Subscribe to language changes and apply them globally
    this.languageService.language$.subscribe((lang: any) => {
      console.log('🌍 Language changed to:', lang);
    });

    // check if user is logged in
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
      console.log('Logged-in user detected:', loggedInUser);
      this.authService.isLoggedIn = true;       // set isLoggedIn to true, showing logout modal
    }
    else {
      console.log('No logged-in user found');
      this.authService.isLoggedIn = false;      // set isLoggedIn to false, not showing logout modal
    }

  }

  handleLogout() {
    console.log('User chose to log out');
    this.authService.logout();
  }
}
