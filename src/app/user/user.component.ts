import { Component, HostListener, OnInit, OnDestroy, ViewEncapsulation, DestroyRef, inject } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterModule }       from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TranslateModule }    from '@ngx-translate/core';

import { AuthService }           from '../../app/auth/auth.service';
import { SidebarComponent }      from '../user/side-bar/side-bar.component';
import { HeaderInComponent }     from './header-in/header-in.component';
import { GlobalFooterComponent } from '../user/global-footer/global-footer.component';
import { UserMenuSyncService }   from '../shared/user-menu-sync.service';


@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    SidebarComponent,
    HeaderInComponent,
    GlobalFooterComponent
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserComponent implements OnInit, OnDestroy {
  public sidebarIsOpen = window.innerWidth >= 992;
  public isMobile      = window.innerWidth < 992;

  private prevBodyOverflow: string = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private auth: AuthService, 
    private menuSync: UserMenuSyncService
  ) {}

  ngOnInit(): void {
    // save initial body overflow style
    this.prevBodyOverflow = getComputedStyle(document.body).overflow || '';

    // when header menu opens → close sidebar (if open)
    this.menuSync.headerMenuOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isHeaderOpen => {
        if (isHeaderOpen && this.sidebarIsOpen) {
          this.sidebarIsOpen = false;
          this.applyBodyScrollLock();
          this.menuSync.setSidebarOpen(false);
        }
      });

    // if sidebar state changes externally → update local state
    this.menuSync.sidebarOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isSidebarOpen => {
        if (this.sidebarIsOpen !== isSidebarOpen) {
          this.sidebarIsOpen = isSidebarOpen;
          this.applyBodyScrollLock();
        }
      });

    // initial sync
    this.menuSync.setSidebarOpen(this.sidebarIsOpen);
    this.applyBodyScrollLock();
  }

  ngOnDestroy(): void {
    // back to initial body overflow style
    document.body.style.overflow = this.prevBodyOverflow;
  }

  // set sidebar open/closed
  setSidebar(open: boolean): void {
    this.sidebarIsOpen = open;
    this.applyBodyScrollLock();
  }

  // toggle sidebar open/closed
  toggleSidebar(): void {
    const next = !this.sidebarIsOpen;
    this.sidebarIsOpen = next;
    this.applyBodyScrollLock();

    this.menuSync.setSidebarOpen(next);

    // if opened now, close header menu
    if (next) this.menuSync.setHeaderMenuOpen(false);
  }

  // handlers for sidebar events
  onSidebarOpenChange(isOpen: boolean): void {
    this.sidebarIsOpen = isOpen;
    this.applyBodyScrollLock();

    this.menuSync.setSidebarOpen(isOpen);
    if (isOpen) this.menuSync.setHeaderMenuOpen(false);
  }

  // when sidebar is closed on mobile
  onSidebarClose(): void {
    this.sidebarIsOpen = false;
    this.applyBodyScrollLock();
    this.menuSync.setSidebarOpen(false);
  }

  // apply or remove body scroll lock based on sidebar state and screen size
  private applyBodyScrollLock(): void {
    const shouldLock = this.isMobile && this.sidebarIsOpen; // lock only on mobile when sidebar is open
    if (shouldLock) {
      document.body.style.overflow = 'hidden';              // disable body scroll
    } else {
      document.body.style.overflow = this.prevBodyOverflow; // restore original body scroll
    }
  }

  // listen to window resize events
  @HostListener('window:resize')
  onResize(): void {
    const nextIsMobile = window.innerWidth < 992;

    // if mobile/desktop state changed
    if (nextIsMobile !== this.isMobile) {
      this.isMobile = nextIsMobile;
      this.sidebarIsOpen = !this.isMobile;

      // sync sidebar state
      this.menuSync.setSidebarOpen(this.sidebarIsOpen);
      if (this.sidebarIsOpen) this.menuSync.setHeaderMenuOpen(false);

      this.applyBodyScrollLock();
      return;
    }

    // just update isMobile flag
    this.isMobile = nextIsMobile;
    this.applyBodyScrollLock();
  }
}
