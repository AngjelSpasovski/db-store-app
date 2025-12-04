// src/app/superadmin/packages/packages.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SuperadminPackagesApi, SuperadminPackageDto, PackagePayload } from '../../shared/superadmin-packages.api';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-superadmin-packages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.scss']
})
export class PackagesComponent implements OnInit {
  packages: SuperadminPackageDto[] = [];
  total = 0;

  loading = false;
  saving = false;
  error: string | null = null;

  perPage = 50;
  page = 1;

  form!: FormGroup;
  editingPackage: SuperadminPackageDto | null = null;
  showFormModal = false;

  constructor(
    private api: SuperadminPackagesApi,
    private fb: FormBuilder,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadPackages();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      credits: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      isActive: [true]
    });
  }

  private buildPayload(): PackagePayload {
    const v = this.form.value;
    return {
      name: v.name,
      description: v.description || null,
      credits: Number(v.credits) || 0,
      price: Number(v.price) || 0,
      discountPercentage: Number(v.discountPercentage) || 0,
      isActive: !!v.isActive
    };
  }

  loadPackages(): void {
    this.loading = true;
    this.error = null;

    this.api.getPackages(this.perPage, this.page).subscribe({
      next: res => {
        this.packages = res.list;
        this.total = res.total;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to load packages';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.editingPackage = null;
    this.resetForm();
    this.showFormModal = true;
  }

  openEditModal(pkg: SuperadminPackageDto): void {
    this.editingPackage = pkg;
    this.form.reset({
      name: pkg.name,
      description: pkg.description,
      credits: pkg.credits,
      price: pkg.price,
      discountPercentage: pkg.discountPercentage,
      isActive: pkg.isActive
    });
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
  }

  resetForm(): void {
    this.form.reset({
      name: '',
      description: '',
      credits: 0,
      price: 0,
      discountPercentage: 0,
      isActive: true
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.saving = true;
    this.error = null;

    if (this.editingPackage) {
      // UPDATE
      this.api.updatePackage(this.editingPackage.id, payload).subscribe({
        next: (updated: SuperadminPackageDto) => {
          const idx = this.packages.findIndex(p => p.id === updated.id);
          if (idx !== -1) {
            this.packages[idx] = { ...updated };
            this.loadPackages();
            this.toast.success('Package updated successfully', { position: 'top-end' });
          }
          this.saving = false;
          this.closeModal();
        },
        error: err => {
          console.error(err);
          this.error = 'Failed to update package';
          this.saving = false;
          this.toast.error('Failed to update package', { position: 'top-end' });
        }
      });
    } else {
      // CREATE
      this.api.createPackage(payload).subscribe({
        next: (created: SuperadminPackageDto) => {
          this.packages = [created, ...this.packages];
          this.total++;
          this.saving = false;
          this.closeModal();
          this.loadPackages();
          this.toast.success('Package created successfully', { position: 'top-end' });
        },
        error: err => {
          console.error(err);
          this.error = 'Failed to create package';
          this.saving = false;
          this.toast.error('Failed to create package', { position: 'top-end' });
        }
      });
    }
  }

  deletePackage(pkg: SuperadminPackageDto): void {
    if (!confirm(`Delete package "${pkg.name}"?`)) {
      return;
    }

    this.saving = true;
    this.error = null;

    this.api.deletePackage(pkg.id).subscribe({
      next: () => {
        this.packages = this.packages.filter(p => p.id !== pkg.id);
        this.total = Math.max(0, this.total - 1);

        if (this.editingPackage && this.editingPackage.id === pkg.id) {
          this.closeModal();
          this.editingPackage = null;
          this.loadPackages();
          this.toast.success('Package deleted successfully', { position: 'top-end' });
        }

        this.saving = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to delete package';
        this.saving = false;
        this.toast.error('Failed to delete package', { position: 'top-end' });
      }
    });
  }
}
