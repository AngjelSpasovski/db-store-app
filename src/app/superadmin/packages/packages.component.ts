// src/app/superadmin/packages/packages.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminApi, PackageRow, CreatePackageDto } from '../../shared/admin.api';
import { ToastService } from '../../shared/toast.service';


@Component({
  standalone: true,
  selector: 'app-packages',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="p-4">
    <h2 class="mb-4">Superadmin ▸ Packages</h2>

    <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-3 md:grid-cols-6 items-end mb-4">
      <div class="md:col-span-2">
        <label class="form-label">Name</label>
        <input class="form-control" formControlName="name">
      </div>
      <div class="md:col-span-2">
        <label class="form-label">Description</label>
        <input class="form-control" formControlName="description">
      </div>
      <div>
        <label class="form-label">Price</label>
        <input type="number" min="0" step="0.01" class="form-control" formControlName="price">
      </div>
      <div>
        <label class="form-label">Credits</label>
        <input type="number" min="1" step="1" class="form-control" formControlName="credits">
      </div>
      <div>
        <label class="form-label">Duration (days)</label>
        <input type="number" min="1" step="1" class="form-control" formControlName="durationDays">
      </div>
      <div class="md:col-span-6 flex items-center gap-3">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="active" formControlName="active">
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
            <th>#</th><th>Name</th><th>Price</th><th>Credits</th><th>Days</th><th>Active</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of rows()">
            <td>{{p.id}}</td>
            <td>{{p.name}}</td>
            <td>{{p.price | number:'1.2-2'}}</td>
            <td>{{p.credits}}</td>
            <td>{{p.durationDays}}</td>
            <td>
              <span class="badge" [class.bg-success]="p.active" [class.bg-secondary]="!p.active">
                {{ p.active ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-info me-2" (click)="edit(p)">Edit</button>
              <button class="btn btn-sm btn-outline-warning" (click)="toggle(p)" [disabled]="saving">Toggle</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
  `,
})
export class PackagesComponent implements OnInit {
  rows = signal<PackageRow[]>([]);
  saving = false;
  editId: number | null = null;

  // ✦ Non-nullable форма со точни типови
  form = this.fb.nonNullable.group({
    name:         this.fb.nonNullable.control('', { validators: [Validators.required] }),
    description:  this.fb.nonNullable.control(''),
    price:        this.fb.nonNullable.control(0,  { validators: [Validators.required, Validators.min(0)] }),
    credits:      this.fb.nonNullable.control(100,{ validators: [Validators.required, Validators.min(1)] }),
    durationDays: this.fb.nonNullable.control(30, { validators: [Validators.required, Validators.min(1)] }),
    active:       this.fb.nonNullable.control(true),
  });

  constructor(private api: AdminApi, private fb: FormBuilder, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.listPackages().subscribe({
      next: res => this.rows.set(res.list || []),
      error: () => this.toast.error('Failed to load packages')
    });
  }

  save() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

// CREATE: сите полиња со конкретни вредности (без undefined)
const createBody: CreatePackageDto = {
  name: v.name.trim(),
  description: v.description.trim(),         // празно е "" (string), не undefined
  price: Number(v.price),
  credits: Number(v.credits),
  durationDays: Number(v.durationDays),
  active: !!v.active,
};

// PATCH: можеш да користиш Partial ако сакаш, или истото тело
const patchBody: Partial<CreatePackageDto> = {
  name: v.name.trim(),
  description: v.description.trim() || undefined, // за patch може и да го изоставиш
  price: Number(v.price),
  credits: Number(v.credits),
  durationDays: Number(v.durationDays),
  active: !!v.active,
};

this.saving = true;
const req = this.editId
  ? this.api.patchPackage(this.editId, patchBody)
  : this.api.createPackage(createBody);

    req.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Package updated' : 'Package created');
        this.saving = false;
        this.editId = null;
        this.form.setValue({ name: '', description: '', price: 0, credits: 100, durationDays: 30, active: true });
        this.load();
      },
      error: () => { this.toast.error('Save failed'); this.saving = false; }
    });
  }

  edit(p: PackageRow) {
    this.editId = p.id;
    this.form.setValue({
      name: p.name ?? '',
      description: p.description ?? '',
      price: p.price ?? 0,
      credits: p.credits ?? 0,
      durationDays: p.durationDays ?? 0,
      active: !!p.active
    });
  }

  cancelEdit() {
    this.editId = null;
    this.form.reset({ name: '', description: '', price: 0, credits: 100, durationDays: 30, active: true });
  }

  toggle(p: PackageRow) {
    this.saving = true;
    this.api.patchPackage(p.id, { active: !p.active }).subscribe({
      next: () => { this.toast.success('Status updated'); this.saving = false; this.load(); },
      error: () => { this.toast.error('Update failed'); this.saving = false; }
    });
  }
}
