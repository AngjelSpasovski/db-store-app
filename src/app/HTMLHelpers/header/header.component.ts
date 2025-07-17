import { Component, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd  } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    LanguageSelectorComponent, 
    FontAwesomeModule, 
    TranslateModule
  ]
})
export class HeaderComponent implements AfterViewInit {
  public faSignOutAlt = faSignOutAlt;                 // Logout icon

  @Input() viewMode: 'home' | 'login' | 'forgot-password' | 'user' = 'home';
  @Input() isLoggedIn: boolean = false;
  @Input() userEmail: string = '';
  
  @ViewChild('userNav') userNav!: ElementRef<HTMLElement>;
  @ViewChild('userMenuButton') userMenuBtn!: ElementRef<HTMLElement>;

  // new state for settings submenu
  public showSettingsMenu = false;
  
  constructor(
    private router: Router, 
    private authService: AuthService, 
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit(): void {
     // Се чита од AuthService тековниот корисник и дали е логиран
    this.userEmail = this.authService.getLoggedInUserEmail() || ''; // Get the logged-in user's email from the AuthService
    this.isLoggedIn = !!sessionStorage.getItem('loggedInUser');     // Check if the user is logged in based on session storage

    console.log(`VIEW_MODE: ${this.viewMode} - IS_LOGEDIN: ${this.isLoggedIn} - USER_EMAIL: ${this.userEmail}`); // Log the current view mode for debugging

    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;

      if (url.includes('/login')) {
        this.viewMode = 'login';
      } 
      else if (url.includes('/forgot-password')) {
        this.viewMode = 'forgot-password';
      } 
      else if (url.includes('/user')) {
        this.viewMode = 'user';
      } 
      else {
        this.viewMode = 'home';
      }

      // Динамички проверуваме дали е логнат корисник (например, после refresh)
      this.userEmail = this.authService.getLoggedInUserEmail() || '';
      this.isLoggedIn = !!this.authService.getCurrentUser();

      // Debug logs
      console.log('🔁 viewMode updated to:', this.viewMode);
      console.log('👤 Logged in:', this.isLoggedIn);
    });
  }

  ngAfterViewInit() {}

  logout() {
    // close the menu immediately
    this.showSettingsMenu = false;
    this.authService.logout();        // AuthService.logout() ќе го избрише 'loggedInUser' и ќе те редиректира на '/login?tab=login'
  }

  // navigation between the sections of the home page
  scrollToSection(id:any, event:any) {
    event.preventDefault();                            // Prevent the default anchor click behavior
    
    const section = document.getElementById(id);       // Get the section element by ID
    if (!section) return;                              // If the section does not exist, return
    
    // Check if the section exists
    if (section) {
      // Scroll to the section smoothly
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /** toggle settings menu open/closed */
  toggleSettings(): void {
    this.showSettingsMenu = !this.showSettingsMenu;
  }


}

