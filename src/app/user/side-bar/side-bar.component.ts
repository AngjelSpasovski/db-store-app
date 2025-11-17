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
export class SidebarComponent implements OnInit {
  @Input() credits = 0;
  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();

  @HostBinding('class.open')  get opened()  { return this.isOpen; }
  @HostBinding('class.closed') get closed() { return !this.isOpen; }

  public currentUser: AuthUser | null = null;
  public isMobile = window.innerWidth < 992;

  /** Observable ако ти треба на друго место */
  public credits$ = this.creditsSvc.credits$;

  /** Реален број за HTML */
  public remainingCredits = 0;

  public menuItems = [
    { label: 'BUY_CREDITS', icon: '🛒', route: '/user/buy-credits' },
    { label: 'SEARCH',      icon: '🔍', route: '/user/new-research' },
    { label: 'BILLING',     icon: '💳', route: '/user/billing' },
    { label: 'FAQS',        icon: '❓', route: '/user/faqs' },
    { label: 'ACCOUNT',     icon: '👤', route: '/user/account' },
  ];

  constructor(
    private auth: AuthService,
    private creditsSvc: CreditsService
  ) {}

  ngOnInit() {
    // 1) повлечи кредити
    this.creditsSvc.refreshFromApi();

    // 2) слушај ги и чувај ги како број
    this.creditsSvc.credits$.subscribe(v => {
      this.remainingCredits = typeof v === 'number' ? v : 0;
    });

    const user = this.auth.getCurrentUser();
    if (user) {
      this.currentUser = user;
    }
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isMobile && !this.isOpen) {
      this.close.emit();
    }
  }

  onMenuItemClick(): void {
    if (this.isMobile) {
      this.close.emit();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 992;
    this.isOpen = !this.isMobile;
  }
}
