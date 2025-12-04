// src/app/admin/users-list/users-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  AdminUsersApi,
  AdminUserSummary,
  AdminUserDetails
} from '../../shared/admin-users.api';
import { ToastService } from '../../shared/toast.service';

@Component({
  standalone: true,
  selector: 'app-admin-users-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class AdminUsersListComponent implements OnInit {

  rows: AdminUserSummary[] = [];
  total = 0;
  page = 1;
  perPage = 10;
  pageOptions = [10, 20, 50];

  togglingId: number | null = null;

  // details modal
  detailsVisible = false;
  selectedRow: AdminUserSummary | null = null;
  selectedUser: AdminUserDetails | null = null;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.perPage));
  }

  constructor(
    private usersApi: AdminUsersApi,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersApi.getUsers(this.perPage, this.page).subscribe({
      next: res => {
        this.rows = res.list ?? [];
        this.total = res.total ?? this.rows.length;
      },
      error: () => this.toast.error('Failed to load users')
    });
  }

  reload(): void {
    this.page = 1;
    this.load();
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }

  openDetails(row: AdminUserSummary): void {
    this.selectedRow = row;
    this.detailsVisible = true;

    this.usersApi.getUserDetails(row.id).subscribe({
      next: details => this.selectedUser = details,
      error: () => this.toast.error('Failed to load user details')
    });
  }

  closeDetails(): void {
    this.detailsVisible = false;
    this.selectedRow = null;
    this.selectedUser = null;
  }

  toggleStatus(u: AdminUserSummary): void {
    const newIsActive = !u.isActive;
    this.togglingId = u.id;

    this.usersApi.updateStatus(u.id, newIsActive).subscribe({
      next: res => {
        this.toast.success('Status updated');
        this.togglingId = null;

        // 🔁 повлечи ја тековната страница пак од backend
        this.load();
      },
      error: err => {
        console.error(err);
        this.toast.error('Update failed');
        this.togglingId = null;
      }
    });
  }

}
