// src/app/HTMLHelpers/header/header.component.ts
import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faUserCircle, faSignOutAlt, faArrowLeft  } from '@fortawesome/free-solid-svg-icons';
import { UserMenuSyncService } from '../../shared/user-menu-sync.service';
@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    LanguageSelectorComponent,
    FontAwesomeModule,
    TranslateModule
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  // icons
  public faSignOutAlt = faSignOutAlt;
  public faUserCircle = faUserCircle;
  public faBackToUser = faArrowLeft;

  public viewMode: 'home' | 'login' | 'forgot-password' | 'reset-password' | 'user' | 'admin' = 'home';
  public isLoggedIn = false;
  public userEmail = '';

  public showSettingsMenu = false;

  public isUserNavOpen  = false;
  public isHomeNavOpen  = false;
  public isAdminNavOpen = false;

  public isSuperadmin = false;
  public isAdminuser  = false;

  private destroy$ = new Subject<void>();

  public ready = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private translate: TranslateService,
    private menuSync: UserMenuSyncService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$?.value;
    this.isLoggedIn = !!u;
    this.userEmail = u?.email ?? '';

    this.viewMode = this.mapUrlToViewMode(this.router.url);
    this.ready = true;

    this.router.events
    .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
    .subscribe((e: any) => {
      const url: string = e.urlAfterRedirects || e.url;

      // ✅ памети last /user/* (за back-to-user да оди таму каде што бил)
      if (url.startsWith('/user/')) {
        localStorage.setItem('last_user_url', url);
      }

      const nextMode = this.mapUrlToViewMode(url);
      if (nextMode !== this.viewMode) {
        // затвори менија при промена на view
        this.isUserNavOpen  = false;
        this.isAdminNavOpen = false;
        this.isHomeNavOpen  = false;
      }

      this.viewMode = nextMode;
    });

      this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn  = !!user;
        this.userEmail   = user?.email ?? '';

        const role = (user?.role || '').toLowerCase();
        this.isSuperadmin = role === 'superadmin';
        this.isAdminuser  = role === 'adminuser';

        // ако нема корисник, затвори ги менијата (за да не останат отворени визуелно)
        if (!user) {
          this.isUserNavOpen  = false;
          this.isAdminNavOpen = false;
          this.isHomeNavOpen  = false;
        }
      });

        this.menuSync.sidebarOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isSidebarOpen => {
        // ако се отвори sidebar додека сме во USER view → затвори го user header менито
        if (this.viewMode === 'user' && isSidebarOpen && this.isUserNavOpen) {
          this.isUserNavOpen = false;
          this.menuSync.setHeaderMenuOpen(false);
        }
      });
  }

  get showBackToUser(): boolean {
    // само adminuser (не superadmin)
    return this.isAdminuser && !this.isSuperadmin;
  }

  goBackToUser(): void {
    const lastUserUrl = localStorage.getItem('last_user_url') || '/user/buy-credits';
    this.router.navigateByUrl(lastUserUrl);
  }

  private mapUrlToViewMode(url: string): typeof this.viewMode {
    if (url.includes('/login')) return 'login';
    if (url.includes('/forgot-password')) return 'forgot-password';
    if (url.includes('/reset-password')) return 'reset-password';
    if (url.includes('/admin')) return 'admin';
    if (url.includes('/user')) return 'user';
    return 'home';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.showSettingsMenu = false;
    this.auth.logout();
  }

  // togglers
  toggleUserNav()  {
    this.isUserNavOpen  = !this.isUserNavOpen;
    this.menuSync.setHeaderMenuOpen(this.isUserNavOpen);
  }
  toggleHomeNav()  { this.isHomeNavOpen  = !this.isHomeNavOpen; }
  toggleAdminNav() { this.isAdminNavOpen = !this.isAdminNavOpen; }

  // closers
  closeUserNav()   { this.isUserNavOpen  = false; }
  closeHomeNav()   { this.isHomeNavOpen  = false; }
  closeAdminNav()  { this.isAdminNavOpen = false; }

  scrollToSection(id: string, evt: Event) {
    evt.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleSettings(): void {
    this.showSettingsMenu = !this.showSettingsMenu;
  }

  // Затвори dropdown и нав кога кликнуваш надвор
  @HostListener('document:click')
  onDocClick() {
    this.showSettingsMenu = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.showSettingsMenu = false;
    this.isUserNavOpen = false;
    this.isAdminNavOpen = false;
  }

}
