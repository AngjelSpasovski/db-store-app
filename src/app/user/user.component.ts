import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService, User } from '../../app/auth/auth.service';

import { SidebarComponent } from '../user/side-bar/side-bar.component';
import { HeaderInComponent } from './header-in/header-in.component';
import { GlobalFooterComponent } from '../user/global-footer/global-footer.component';


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
export class UserComponent implements OnInit {

  public sidebarOpen = false;
  public isMobile = window.innerWidth < 992;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // open sidebar by default on desktop
    if (!this.isMobile) this.sidebarOpen = true;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    if (this.isMobile) this.sidebarOpen = false;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 992;
    if (!this.isMobile) this.sidebarOpen = true;
  }
}