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
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AuthService } from 'src/app/auth/auth.service';
import type { AuthUser } from 'src/app/auth/auth.service';
import { CreditsService } from '../buy-credits/credit.service';

// FontAwesome икони
import {
  faCartShopping,
  faMagnifyingGlass,
  faFileInvoiceDollar,
  faCircleQuestion,
  faUser,
  faChevronLeft,
  faBars,
  faCoins,
  faUserShield
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
  ],
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

  // FontAwesome icons за toggle и кредити
  public faToggleOpen   = faChevronLeft;
  public faToggleClosed = faBars;
  public faCredits      = faCoins;
  public faAdmin        = faUserShield;

  // Менито – веќе не се emoji, туку FontAwesome објекти
  public menuItems = [
    { label: 'BUY_CREDITS', icon: faCartShopping,     route: '/user/buy-credits' },
    { label: 'SEARCH',      icon: faMagnifyingGlass,  route: '/user/new-research' },
    { label: 'BILLING',     icon: faFileInvoiceDollar,route: '/user/billing' },
    { label: 'FAQS',        icon: faCircleQuestion,   route: '/user/faqs' },
    { label: 'ACCOUNT',     icon: faUser,             route: '/user/account' },
  ];

  constructor(
    private auth: AuthService,
    private creditsSvc: CreditsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.creditsSvc.refreshFromApi();
    this.currentUser = this.auth.getCurrentUser();

    this.isMobile = window.innerWidth < 992;
    if (this.isMobile) {
      this.isOpen = false;
    }
  }

  // GET FUNCTIONS
  get showGoToAdmin(): boolean {
    return (this.currentUser?.role || '').toLowerCase() === 'adminuser';
  }

  get adminRoute(): string {
    return '/admin';
  }
  //------------

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

  goToAdmin(): void {
    this.router.navigateByUrl('/admin');
    this.onMenuItemClick();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 992;
    this.isOpen = !this.isMobile;
  }
}
