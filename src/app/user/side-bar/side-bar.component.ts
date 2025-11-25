// src/app/user/side-bar/side-bar.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener,
  HostBinding,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from 'src/app/auth/auth.service';
import type { AuthUser } from 'src/app/auth/auth.service';
import { CreditsService } from '../buy-credits/credit.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, TranslateModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  @HostBinding('class.open') get opened() {
    return this.isOpen;
  }
  @HostBinding('class.closed') get closed() {
    return !this.isOpen;
  }

  public currentUser: AuthUser | null = null;
  public isMobile = window.innerWidth < 992;

  /** Stream со кредити од сервисот (се слуша со async pipe во template) */
  public credits$ = this.creditsSvc.credits$;

  public menuItems = [
    { label: 'BUY_CREDITS', icon: '🛒', route: '/user/buy-credits' },
    { label: 'SEARCH', icon: '🔍', route: '/user/new-research' },
    { label: 'BILLING', icon: '💳', route: '/user/billing' },
    { label: 'FAQS', icon: '❓', route: '/user/faqs' },
    { label: 'ACCOUNT', icon: '👤', route: '/user/account' },
  ];

  constructor(
    private auth: AuthService,
    private creditsSvc: CreditsService
  ) {}

  ngOnInit(): void {
    // Влечи кредити на влегување во апликацијата
    this.creditsSvc.refreshFromApi();

    // Корисник за header делот
    this.currentUser = this.auth.getCurrentUser();

    // initial state за мобилно/desktop
    this.isMobile = window.innerWidth < 992;
    if (this.isMobile) {
      this.isOpen = false;
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
  onResize(): void {
    this.isMobile = window.innerWidth < 992;
    this.isOpen = !this.isMobile;
  }
}
