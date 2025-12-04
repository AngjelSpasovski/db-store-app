// src/app/superadmin/admins/admins.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApi, AdminRow } from '../../shared/admin.api';
import { ToastService } from '../../shared/toast.service';

@Component({
  standalone: true,
  selector: 'app-superadmin-admins',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.scss']
})
export class AdminsComponent implements OnInit {

  admins: AdminRow[] = [];
  loading = false;
  saving = false;
  error: string | null = null;

  perPage = 20;
  page = 1;
  total = 0;
  get totalPages() { return Math.max(1, Math.ceil(this.total / this.perPage)); }

  // modal state
  modalOpen = false;
  editId: number | null = null;

  form = this.fb.nonNullable.group({
    firstName:   ['', [Validators.required]],
    lastName:    ['', [Validators.required]],
    email:       ['', [Validators.required, Validators.email]],
    companyName: [''],
    isActive:    [true]
  });

  constructor(
    private api: AdminApi,
    private fb: FormBuilder,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    this.api.listAdmins(this.perPage, this.page).subscribe({
      next: res => {
        // бекендот може да враќа или array или { list, total }
        if (Array.isArray(res as any)) {
          this.admins = res as any;
          this.total = this.admins.length;
        } else {
          const r: any = res;
          this.admins = r.list || [];
          this.total = r.total || this.admins.length;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load admins';
        this.toast.error('Failed to load admins');
      }
    });
  }

  // ---------- MODAL ----------

  openCreateModal(): void {
    this.editId = null;
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      companyName: '',
      isActive: true
    });
    this.modalOpen = true;
  }

  openEditModal(a: AdminRow): void {
    this.editId = a.id;
    this.form.reset({
      firstName:   a.firstName ?? '',
      lastName:    a.lastName ?? '',
      email:       a.email ?? '',
      companyName: a.companyName ?? '',
      isActive:    !!a.isActive
    });
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  // ---------- SAVE / CRUD ----------

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const body = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim().toLowerCase(),
      companyName: v.companyName.trim() || undefined,
      isActive: !!v.isActive
    };

    this.saving = true;

    const req$ = this.editId
      ? this.api.patchAdmin(this.editId, body)
      : this.api.createAdmin(body);

    req$.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Admin updated' : 'Admin created', { position: 'top-end' });
        this.saving = false;
        this.closeModal();
        this.load();
      },
      error: () => {
        this.toast.error('Save failed', { position: 'top-end' });
        this.saving = false;
      }
    });
  }

  toggleActive(a: AdminRow): void {
    this.saving = true;
    this.api.patchAdmin(a.id, { isActive: !a.isActive }).subscribe({
      next: () => {
        this.toast.success('Status updated', { position: 'top-end' });
        this.saving = false;
        this.load();
      },
      error: () => {
        this.toast.error('Update failed');
        this.saving = false;
      }
    });
  }

  delete(a: AdminRow): void {
    if (!confirm(`Delete admin ${a.firstName} ${a.lastName}?`)) return;
    this.saving = true;
    this.api.deleteAdmin(a.id).subscribe({
      next: () => {
        this.saving = false;
        this.load();
        this.toast.success('Admin deleted successfully', { position: 'top-end' });
      },
      error: () => {
        this.toast.error('Delete failed', { position: 'top-end' });
        this.saving = false;
      }
    });
  }

  prev(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  next(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }
}
