// src/app/admin/users-list/users-list.component.ts
import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi, AdminUserRow } from '../../shared/admin.api';
import { ToastService } from '../../shared/toast.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-users-list',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4">
    <h2 class="mb-3">Users</h2>

    <div class="mb-3 flex gap-2 items-center">
      <label>Per page:</label>
      <select [(ngModel)]="perPage" (change)="load()" class="form-select w-auto">
        <option *ngFor="let p of [10,20,50]" [value]="p">{{p}}</option>
      </select>
    </div>

    <div class="table-responsive">
      <table class="table table-dark table-striped align-middle">
        <thead><tr>
          <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th></th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let u of rows">
            <td>{{u.id}}</td>
            <td>{{u.firstName}} {{u.lastName}}</td>
            <td>{{u.email}}</td>
            <td>{{u.role}}</td>
            <td>
              <span class="badge" [class.bg-success]="u.isActive" [class.bg-secondary]="!u.isActive">
                {{ u.isActive ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-info me-2" (click)="view(u)">View</button>
              <button class="btn btn-sm btn-outline-warning" (click)="toggle(u)">
                {{ u.isActive ? 'Deactivate' : 'Activate' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-between mt-3">
      <button class="btn btn-outline-light" [disabled]="page<=1" (click)="prev()">Prev</button>
      <div>Page {{page}} / {{totalPages}}</div>
      <button class="btn btn-outline-light" [disabled]="page>=totalPages" (click)="next()">Next</button>
    </div>
  </div>
  `,
  styles: [``]
})
export class AdminUsersListComponent implements OnInit {
  rows: AdminUserRow[] = [];
  perPage = 10;
  page = 1;
  total = 0;
  get totalPages() { return Math.max(1, Math.ceil(this.total / this.perPage)); }

  constructor(private api: AdminApi, private toast: ToastService, private router: Router) {}
  ngOnInit(){ this.load(); }

  load(){
    this.api.listUsers(this.perPage, this.page).subscribe({
      next: res => { this.rows = res.list || []; this.total = res.total || this.rows.length; },
      error: () => this.toast.error('Failed to load users')
    });
  }

  view(u: AdminUserRow){
    this.router.navigate(['/admin/user-details'], {
      queryParams: { id: u.id }
    });
  }

  toggle(u: AdminUserRow) {
    const nextInactive = !u.isActive;     // ако е активен -> праќаме inactive: true
    this.api.patchUserStatus(u.id, nextInactive).subscribe({
      next: res => {
        this.toast.success('Status updated');
        //u.isActive = res.user.isActive;   // земи ја вистинската состојба од backend
      },
      error: () => this.toast.error('Update failed')
    });
  }

  prev(){ if (this.page > 1) { this.page--; this.load(); } }
  next(){ if (this.page < this.totalPages) { this.page++; this.load(); } }

}
