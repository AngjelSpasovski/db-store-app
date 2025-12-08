import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserMenuSyncService {
  private sidebarOpenSubject = new BehaviorSubject<boolean>(false);
  sidebarOpen$ = this.sidebarOpenSubject.asObservable();

  private headerMenuOpenSubject = new BehaviorSubject<boolean>(false);
  headerMenuOpen$ = this.headerMenuOpenSubject.asObservable();

  setSidebarOpen(open: boolean): void {
    this.sidebarOpenSubject.next(open);
  }

  setHeaderMenuOpen(open: boolean): void {
    this.headerMenuOpenSubject.next(open);
  }
}
