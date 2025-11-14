// src/app/HTMLHelpers/header/header.component.ts
import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

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

  @Input() viewMode: 'home' | 'login' | 'forgot-password' | 'reset-password' | 'user' | 'admin' = 'home';
  @Input() isLoggedIn = false;
  @Input() userEmail = '';

  public showSettingsMenu = false;

  public isUserNavOpen = false;
  public isHomeNavOpen = false;
  public isAdminNavOpen = false;

  public isSuperadmin = false;

  private destroy$ = new Subject<void>();

  public ready = false;

  get isAdmin(): boolean {
    return (this.userEmail || '').toLowerCase() === 'angjel.spasovski@gmail.com';
  }

  constructor(
    private router: Router,
    private auth: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // A) Синхроно земи го тековниот корисник (BehaviorSubject.value)
    const u = this.auth.currentUser$?.value;
    this.isLoggedIn = !!u;
    this.userEmail = u?.email ?? '';

    // B) Сетирај viewMode ИТНО според моменталниот URL (пред да стигнат router events)
    this.viewMode = this.mapUrlToViewMode(this.router.url);
    this.ready = true;

    // C) После тоа – слушај ги промените на URL (NavigationEnd)
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe((e: any) => {
        const url: string = e.urlAfterRedirects || e.url;
        this.viewMode = this.mapUrlToViewMode(url);
      });

    // D) Следи ги идните промени на корисникот
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(u2 => {
        this.isLoggedIn = !!u2;
        this.userEmail = u2?.email ?? '';
      });

      //
      this.auth.currentUser$.subscribe(u => {
        this.isSuperadmin = (u?.role?.toLowerCase() === 'superadmin');
      });
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
  toggleUserNav()  { this.isUserNavOpen  = !this.isUserNavOpen; }
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
