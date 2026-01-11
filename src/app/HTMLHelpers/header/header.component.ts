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
    if (url.includes('/login') || url.includes('/signup')) return 'login';
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
  toggleUserNav() {
    const next = !this.isUserNavOpen;
    this.isUserNavOpen = next;

    // ✅ кога header се отвора → затвори sidebar
    if (next) {
      this.menuSync.setSidebarOpen(false);
    }

    this.menuSync.setHeaderMenuOpen(next);
  }

  // toggles
  toggleHomeNav() {
    const next = !this.isHomeNavOpen;
    this.isHomeNavOpen = next;
    if (next) {
      this.isUserNavOpen = false;
      this.isAdminNavOpen = false;
      this.menuSync.setHeaderMenuOpen(false);
    }
  }

  toggleAdminNav() {
    const next = !this.isAdminNavOpen;
    this.isAdminNavOpen = next;
    if (next) {
      this.isHomeNavOpen = false;
      this.isUserNavOpen = false;
      this.menuSync.setHeaderMenuOpen(false);
    }
  }
  toggleSettings(): void {
    this.showSettingsMenu = !this.showSettingsMenu;
  }

  // closers
  closeUserNav() {
    this.isUserNavOpen = false;
    this.menuSync.setHeaderMenuOpen(false);
  }
  closeHomeNav()   { this.isHomeNavOpen  = false; }
  closeAdminNav()  { this.isAdminNavOpen = false; }
  closeAnyNav(): void {
    this.isUserNavOpen = false;
    this.isAdminNavOpen = false;
    this.isHomeNavOpen = false;

    // ✅ само user header се синхронизира со sidebar преку service
    this.menuSync.setHeaderMenuOpen(false);
  }

  private getScrollRoot(): HTMLElement | null {
    const wrap = document.getElementById('content-wrap');
    if (wrap) return wrap;

    const ion = document.querySelector('ion-content') as any;
    const inner = ion?.shadowRoot?.querySelector('.inner-scroll') as HTMLElement | null;
    return inner ?? null;
  }

  scrollToSection(id: string, ev: Event) {
    ev.preventDefault();

    const sec = document.getElementById(id);
    if (!sec) return;

    const root = this.getScrollRoot(); // content-wrap или ion-content .inner-scroll
    const headerEl = document.querySelector('header.app-header') as HTMLElement | null;
    const headerH = headerEl?.offsetHeight ?? 0;

    // ✅ ако root постои (inner-scroll), rootTop веќе е под header → НЕ одземаме headerH
    const offset = root ? 8 : (headerH + 8);

    if (root) {
      const rootTop = root.getBoundingClientRect().top;
      const secTop  = sec.getBoundingClientRect().top;

      const top = (secTop - rootTop) + root.scrollTop - offset;
      root.scrollTo({ top, behavior: 'smooth' });
    } else {
      const top = sec.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    // optional: затвори мобилно мени
    this.isHomeNavOpen = false;
  }

  // ✅ затвори менијата ако се кликне надвор од header
  @HostListener('document:click', ['$event'])
  onDocClick(evt: MouseEvent) {
    const target = evt.target as HTMLElement;

    if (!target.closest('.app-header')) {
      this.isAdminNavOpen = false;
      this.isUserNavOpen = false;
      this.isHomeNavOpen = false;

      // ✅ sync
      this.menuSync.setHeaderMenuOpen(false);
    }

    this.showSettingsMenu = false;
  }

  // ✅ затвори менијата ако се притисне ESC
  @HostListener('document:keydown.escape')
  onEsc() {
    this.showSettingsMenu = false;
    this.isUserNavOpen = false;
    this.isAdminNavOpen = false;

    // ✅ sync
    this.menuSync.setHeaderMenuOpen(false);
  }

}
