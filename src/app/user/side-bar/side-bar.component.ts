import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  
  @Input() open = false;                        // Whether the sidebar is open or not ... Controls open/close state 
  @Input() credits = 0;                         /** Credits to display in the sidebar */
  @Output() close = new EventEmitter<void>();   /** Emitted when a menu link is clicked on mobile */

  /** Call this in the template on <a> click */
  closeSidebar(): void {
    this.close.emit();
  }
}