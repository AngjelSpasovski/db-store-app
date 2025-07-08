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
  /** Controls open/close state */
  @Input() open = false;
  /** Remaining credits to display */
  @Input() credits = 0;
  /** Emitted when a menu link is clicked on mobile */
  @Output() close = new EventEmitter<void>();

  /** Call this in the template on <a> click */
  onLinkClick(): void {
    this.close.emit();
  }
}