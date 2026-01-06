import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserMenuSyncService {
  private readonly sidebarOpenSubject = new BehaviorSubject<boolean>(false);
  readonly sidebarOpen$ = this.sidebarOpenSubject.asObservable();

  private readonly headerMenuOpenSubject = new BehaviorSubject<boolean>(false);
  readonly headerMenuOpen$ = this.headerMenuOpenSubject.asObservable();

  setSidebarOpen(isOpen: boolean): void {
    this.sidebarOpenSubject.next(isOpen);
  }

  setHeaderMenuOpen(isOpen: boolean): void {
    this.headerMenuOpenSubject.next(isOpen);
  }

  closeAll(): void {
    this.setSidebarOpen(false);
    this.setHeaderMenuOpen(false);
  }
}
