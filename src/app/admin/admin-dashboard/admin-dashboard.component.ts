import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="mb-3">Admin Dashboard</h1>
    <p class="text-muted">Welcome, Angjel. Ова е админ панелот.</p>
  `
})
export class AdminDashboardComponent {}
