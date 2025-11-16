// src/app/user/side-bar/side-bar.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener, HostBinding  } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // for *ngFor, *ngIf, etc.
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { CreditsService } from '../buy-credits/credit.service';
import type { AuthUser } from '../../auth/auth.service';
import { inject, OnInit } from '@angular/core';
import { CREDITS_API } from '../../shared/tokens.api';
import { CreditsApi } from '../../shared/credits.api';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    TranslateModule
  ],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  @Input() credits = 0;                         /** Credits to display in the sidebar */
  @Input() isOpen = false;                      /** Whether the sidebar is open */

  @Output() close = new EventEmitter<void>();   /** Emitted when a menu link is clicked on mobile */

  @HostBinding('class.open')  get opened() {
    return this.isOpen;
  }
  @HostBinding('class.closed') get closed() {
    return !this.isOpen;
  }

  public currentUser: AuthUser | null = null;

  public isMobile = window.innerWidth < 992;

  public currentCredits = 0;                    // ← Current credits from session storage
  public credits$ = this.creditsSvc.credits$;    // ← Observable на кредити

  private creditsApi = inject<CreditsApi>(CREDITS_API);
  public remainingCredits = 0;

  public menuItems = [
    { label: 'BUY_CREDITS', icon: '🛒', route: '/user/buy-credits' },
    { label: 'SEARCH',      icon: '🔍', route: '/user/new-research' },
    { label: 'BILLING',     icon: '💳', route: '/user/billing' },
    { label: 'FAQS',        icon: '❓', route: '/user/faqs' },
    { label: 'ACCOUNT',     icon: '👤', route: '/user/account' },
    // …
  ];

  constructor(
    private auth: AuthService,
    private creditsSvc: CreditsService
  ) { }

  ngOnInit() {
    // 1) повлечи од API
    this.creditsSvc.refreshFromApi();

    // 2) претплати се на кредити и покажувај ги и во sidebar и на icon
    this.creditsSvc.credits$.subscribe(v => {
      this.remainingCredits = v;
    });

    // user load од AuthService останува како што е
    const user: AuthUser | null = this.auth.getCurrentUser();
    if (user) {
      this.currentUser = user;
    }
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isMobile && !this.isOpen) {
      this.close.emit();  // notify parent on mobile collapse
    }
  }

  /** Called when any menu link is clicked */
  onMenuItemClick(): void {
    // only collapse on mobile
    if (this.isMobile) {
      this.close.emit();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 992;
    this.isOpen = !this.isMobile;   // open on desktop, closed on mobile
  }

}
