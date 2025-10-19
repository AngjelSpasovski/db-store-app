import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  imports: [CommonModule, RouterOutlet],
  template: `
    <section class="container py-4">
      <router-outlet></router-outlet>
    </section>
  `,
})
export class AdminShellComponent {}
