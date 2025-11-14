// src/app/superadmin/admins/admins.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminApi, AdminRow } from '../../shared/admin.api';
import { ToastService } from '../../shared/toast.service';

@Component({
  standalone: true,
  selector: 'app-superadmin-admins',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="p-4">
    <h2 class="mb-4">Superadmin ▸ Admins</h2>

    <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-3 md:grid-cols-6 items-end mb-4">
      <div>
        <label class="form-label">First name</label>
        <input class="form-control" formControlName="firstName">
      </div>
      <div>
        <label class="form-label">Last name</label>
        <input class="form-control" formControlName="lastName">
      </div>
      <div class="md:col-span-2">
        <label class="form-label">Email</label>
        <input class="form-control" formControlName="email">
      </div>
      <div class="md:col-span-2">
        <label class="form-label">Company</label>
        <input class="form-control" formControlName="companyName">
      </div>

      <div class="md:col-span-6 flex items-center gap-3">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="active" formControlName="isActive">
          <label class="form-check-label" for="active">Active</label>
        </div>

        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
          {{ editId ? 'Update' : 'Create' }}
        </button>
        <button *ngIf="editId" type="button" class="btn btn-outline-secondary" (click)="cancelEdit()">Cancel</button>
      </div>
    </form>

    <div class="table-responsive">
      <table class="table table-dark table-striped align-middle">
        <thead>
          <tr>
            <th>#</th><th>Name</th><th>Email</th><th>Company</th><th>Active</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let a of rows()">
            <td>{{a.id}}</td>
            <td>{{a.firstName}} {{a.lastName}}</td>
            <td>{{a.email}}</td>
            <td>{{a.companyName}}</td>
            <td>
              <span class="badge" [class.bg-success]="a.isActive" [class.bg-secondary]="!a.isActive">
                {{ a.isActive ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-info me-2" (click)="edit(a)">Edit</button>
              <button class="btn btn-sm btn-outline-warning me-2" (click)="toggle(a)" [disabled]="saving">
                {{ a.isActive ? 'Deactivate' : 'Activate' }}
              </button>
              <button class="btn btn-sm btn-outline-danger" (click)="remove(a)" [disabled]="saving">
                Delete
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
})
export class AdminsComponent implements OnInit {
  rows = signal<AdminRow[]>([]);
  saving = false;
  editId: number | null = null;

  perPage = 20;
  page = 1;
  total = 0;
  get totalPages() { return Math.max(1, Math.ceil(this.total / this.perPage)); }

  form = this.fb.nonNullable.group({
    firstName:   this.fb.nonNullable.control('', { validators: [Validators.required] }),
    lastName:    this.fb.nonNullable.control('', { validators: [Validators.required] }),
    email:       this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    companyName: this.fb.nonNullable.control(''),
    isActive:    this.fb.nonNullable.control(true),
  });

  constructor(private api: AdminApi, private fb: FormBuilder, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.listAdmins(this.perPage, this.page).subscribe({
      next: res => {
        // ако бекендот не е paged, адаптирај:
        if (Array.isArray((res as any))) {
          this.rows.set(res as any);
          this.total = (res as any).length ?? this.rows().length;
        } else {
          this.rows.set(res.list || []);
          this.total = res.total || this.rows().length;
        }
      },
      error: () => this.toast.error('Failed to load admins')
    });
  }

  save() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const body = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim().toLowerCase(),
      companyName: v.companyName.trim() || undefined,
      isActive: !!v.isActive,
    };

    this.saving = true;
    const req = this.editId
      ? this.api.patchAdmin(this.editId, body)
      : this.api.createAdmin(body);

    req.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Admin updated' : 'Admin created');
        this.saving = false;
        this.cancelEdit();
        this.load();
      },
      error: () => { this.toast.error('Save failed'); this.saving = false; }
    });
  }

  edit(a: AdminRow) {
    this.editId = a.id;
    this.form.setValue({
      firstName: a.firstName ?? '',
      lastName: a.lastName ?? '',
      email: a.email ?? '',
      companyName: a.companyName ?? '',
      isActive: !!a.isActive,
    });
  }

  cancelEdit() {
    this.editId = null;
    this.form.setValue({
      firstName: '', lastName: '', email: '', companyName: '', isActive: true
    });
  }

  toggle(a: AdminRow) {
    this.saving = true;
    this.api.patchAdmin(a.id, { isActive: !a.isActive }).subscribe({
      next: () => { this.toast.success('Status updated'); this.saving = false; this.load(); },
      error: () => { this.toast.error('Update failed'); this.saving = false; }
    });
  }

  remove(a: AdminRow) {
    if (!confirm(`Delete admin ${a.firstName} ${a.lastName}?`)) return;
    this.saving = true;
    this.api.deleteAdmin(a.id).subscribe({
      next: () => { this.toast.success('Admin deleted'); this.saving = false; this.load(); },
      error: () => { this.toast.error('Delete failed'); this.saving = false; }
    });
  }

  prev(){ if (this.page > 1) { this.page--; this.load(); } }
  next(){ if (this.page < this.totalPages) { this.page++; this.load(); } }
}
