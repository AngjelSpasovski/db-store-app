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
  // ====== LIST STATE =======================================================================
  packages: SuperadminPackageDto[] = [];
  total = 0;

  loading = false;
  saving = false;
  error: string | null = null;

  perPage = 50;
  page = 1;

  // ====== MODAL / FORM STATE ================================================================
  showFormModal = false;
  editingPackage: SuperadminPackageDto | null = null;
  form!: FormGroup;

  constructor(
    private api: SuperadminPackagesApi,
    private fb: FormBuilder,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPackages();
  }

  // ====== FORM INIT =========================================================================
  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      credits: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      isActive: [true]
    });
  }

  // ====== DATA ==============================================================================
  loadPackages(): void {
    this.loading = true;
    this.error = null;

    this.api.getPackages(this.perPage, this.page).subscribe({
      next: (res) => {
        this.packages = res.list ?? [];
        this.total = res.total ?? 0;
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error(err);
        this.error = 'Failed to load packages';
        this.loading = false;
      }
    });
  }

  // ====== MODAL OPEN/CLOSE ==================================================================
  openCreateModal(): void {
    this.editingPackage = null;
    this.resetFormDefaults();
    this.showFormModal = true;
  }

  openEditModal(pkg: SuperadminPackageDto): void {
    this.editingPackage = pkg;
    this.patchFormFromPackage(pkg);
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
  }

  // ====== PUBLIC ACTIONS (used by template) =================================================
  /** Reset button action from template */
  onReset(): void {
    if (this.editingPackage) this.patchFormFromPackage(this.editingPackage);
    else this.resetFormDefaults();
  }

  // ====== SUBMIT =============================================================================
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const payload = this.buildPayloadFromForm();

    // ========== CREATE ======================================================================
    if (!this.editingPackage) {
      this.api.createPackage(payload).subscribe({
        next: () => {
          this.toast.success('Package created successfully', { position: 'top-end' });
          this.saving = false;
          this.closeModal();
          this.loadPackages();
        },
        error: (err: unknown) => {
          console.error(err);
          this.error = 'Failed to create package';
          this.saving = false;
          this.toast.error(this.error, { position: 'top-end' });
        }
      });
      return;
    }

    // ========== UPDATE ======================================================================
    const id = this.editingPackage.id;
    const wasActive = !!this.editingPackage.isActive;
    const nextActive = !!payload.isActive;

    /**
     * Active/Inactive се менува САМО од модалот (isActive switch).
     * Backend правило:
     * - Active -> Inactive: PATCH /:id/deactivate
     * - Anything else: PATCH /:id  (вклучува Inactive -> Active)
     */
    if (wasActive && !nextActive) {
      // Deactivate via dedicated endpoint
      this.api.deactivatePackage(id).subscribe({
        next: () => {
          this.toast.success('Package deactivated successfully', { position: 'top-end' });
          this.saving = false;
          this.closeModal();
          this.editingPackage = null;
          this.loadPackages();
        },
        error: (err: unknown) => {
          console.error(err);
          this.error = 'Failed to deactivate package';
          this.saving = false;
          this.toast.error(this.error, { position: 'top-end' });
        }
      });

      return;
    }

    // Normal update (also covers Inactive -> Active)
    this.api.updatePackage(id, payload).subscribe({
      next: () => {
        this.toast.success('Package updated successfully', { position: 'top-end' });
        this.saving = false;
        this.closeModal();
        this.editingPackage = null;
        this.loadPackages();
      },
      error: (err: unknown) => {
        console.error(err);
        this.error = 'Failed to update package';
        this.saving = false;
        this.toast.error(this.error, { position: 'top-end' });
      }
    });
  }

  // ====== PRIVATE HELPERS ===================================================================
  /** Normalize + convert form -> payload */
  private buildPayloadFromForm(): PackagePayload {
    const v = this.form.value;

    return {
      name: v.name?.trim() ?? '',
      description: (v.description?.trim?.() ? v.description.trim() : null),
      credits: Number(v.credits) || 0,
      price: Number(v.price) || 0,
      discountPercentage: Number(v.discountPercentage) || 0,
      isActive: !!v.isActive
    };
  }

  /** Patch form from a package */
  private patchFormFromPackage(pkg: SuperadminPackageDto): void {
    this.form.reset({
      name: pkg.name ?? '',
      description: pkg.description ?? '',
      credits: pkg.credits ?? 0,
      price: pkg.price ?? 0,
      discountPercentage: pkg.discountPercentage ?? 0,
      isActive: !!pkg.isActive
    });
  }

  /** Reset defaults for create */
  private resetFormDefaults(): void {
    this.form.reset({
      name: '',
      description: '',
      credits: 0,
      price: 0,
      discountPercentage: 0,
      isActive: true
    });
  }
}
