import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
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
  imports: [CommonModule, LanguageSelectorComponent, FontAwesomeModule, TranslateModule]
})
export class HeaderComponent implements OnInit, OnDestroy {
  // icons
  public faSignOutAlt = faSignOutAlt;

  @Input() viewMode: 'home' | 'login' | 'forgot-password' |'reset-password' | 'user' = 'home';
  @Input() isLoggedIn = false;
  @Input() userEmail = '';

  public showSettingsMenu = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private auth: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // 1) следи го URL-от и поставувај viewMode
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe((e: any) => {
        const url: string = e.urlAfterRedirects || e.url;
        if (url.includes('/login')) {               this.viewMode = 'login'; }
        else if (url.includes('/forgot-password')){ this.viewMode = 'forgot-password'; }
        else if (url.includes('/reset-password')){  this.viewMode = 'reset-password'; }
        else if (url.includes('/user')){            this.viewMode = 'user'; }
        else  {                                     this.viewMode = 'home'; }
      });

    // 2) следи го тековниот корисник од AuthService, без sessionStorage директно
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => {
        this.isLoggedIn = !!u;
        this.userEmail  = u?.email ?? '';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSettings(): void {
    this.showSettingsMenu = !this.showSettingsMenu;
  }

  logout(): void {
    this.showSettingsMenu = false;
    this.auth.logout(); // ова веќе редиректира кон /login?tab=login
  }

  scrollToSection(id: string, evt: Event) {
    evt.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

}
