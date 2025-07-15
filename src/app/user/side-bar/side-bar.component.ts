import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // for *ngFor, *ngIf, etc.
import { TranslateModule } from '@ngx-translate/core';
import { AuthService, User } from 'src/app/auth/auth.service';
import { CreditsService } from '../buy-credits/credit.service';

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

  @Input() open = false;                        // Whether the sidebar is open or not ... Controls open/close state 
  @Input() credits = 0;                         /** Credits to display in the sidebar */
  @Output() close = new EventEmitter<void>();   /** Emitted when a menu link is clicked on mobile */

  public currentCredits = 0;
  public sidebarOpen = false;
  public isMobile = window.innerWidth < 992;
  public credits$ = this.creditsSvc.credits$;    // ← Observable на кредити

  public menuItems = [
    { label: 'BUY_CREDITS', icon: '🛒', route: '/user/buy-credits' },
    { label: 'SEARCH',      icon: '🔍', route: '/user/new-research' },
    { label: 'BILLING',     icon: '💳', route: '/user/billing' },
//  { label: 'HISTORY',     icon: '📜', route: '/user/history' },
    { label: 'FAQS',        icon: '❓', route: '/user/faqs' },
    // …
  ];

  constructor(
    private auth: AuthService,
    private creditsSvc: CreditsService
  ) { }

  ngOnInit() {
    // open sidebar by default on desktop
    if (!this.isMobile) this.sidebarOpen = true;

    // init credits
    const user: User | null = this.auth.getCurrentUser();
    if (user) {
      const key = `credits_${user.email}`;
      const stored = sessionStorage.getItem(key);
      this.currentCredits = stored ? +stored : 0;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    if (this.isMobile) {
      this.sidebarOpen = false;
      this.close.emit();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 992;
    if (!this.isMobile) {
      this.sidebarOpen = true;  // секогаш отворено на desktop
    }
  }

}