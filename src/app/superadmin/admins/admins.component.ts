// scr/app/superadmin/admins/admins.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import { SuperadminAdminsApi, SuperadminAdminDto } from '../../shared/superadmin-admins.api';
import { ToastService } from '../../shared/toast.service';

type CreateAdminForm = FormGroup<{
  firstName:    FormControl<string>;
  lastName:     FormControl<string>;
  email:        FormControl<string>;
  companyName:  FormControl<string>;
  password:     FormControl<string>;
}>;

type EditAdminForm = FormGroup<{
  firstName:    FormControl<string>;
  lastName:     FormControl<string>;
  companyName:  FormControl<string>;
  password:     FormControl<string>; // optional ('' = keep)
}>;

@Component({
  selector: 'app-superadmin-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.scss']
})
export class AdminsComponent implements OnInit, OnDestroy {
  loading = false;

  perPage = 20;
  page = 1;
  total = 0;

  admins: SuperadminAdminDto[] = [];

  showCreateModal = false;
  createForm!: CreateAdminForm;

  showEditModal = false;
  editForm!: EditAdminForm;
  editingId: number | null = null;

  private sub = new Subscription();

  constructor(
    private api: SuperadminAdminsApi,
    private fb: FormBuilder,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.nonNullable.group({
      firstName:    this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
      lastName:     this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
      email:        this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(120)]),
      companyName:  this.fb.nonNullable.control(''),
      password:     this.fb.nonNullable.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]),
    });

    this.editForm = this.fb.nonNullable.group({
      firstName:    this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
      lastName:     this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
      companyName:  this.fb.nonNullable.control(''),
      password:     this.fb.nonNullable.control('', [Validators.minLength(8), Validators.maxLength(128)]),
    });

    // emailExists cleanup
    const emailSub = this.createForm.controls.email.valueChanges.subscribe(() => {
      const c = this.createForm.controls.email;
      if (c.hasError('emailExists')) {
        const { emailExists, ...rest } = c.errors || {};
        c.setErrors(Object.keys(rest).length ? rest : null);
      }
    });
    this.sub.add(emailSub);

    this.load();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  load(): void {
    this.loading = true;

    const s = this.api
      .getAdmins(this.perPage, this.page)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.admins = res.list || [];
          this.total = res.total ?? this.admins.length ?? 0;
        },
        error: (err) => this.handleHttpError(err, 'Failed to load admins.')
      });

    this.sub.add(s);
  }

  openCreate(): void {
    this.createForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      companyName: '',
      password: ''
    });

    this.showCreateModal = true;
  }

  closeCreate(): void {
    this.showCreateModal = false;
  }

 submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.toast.show('Please fill all required fields correctly.', false, 3500, 'top-end');
      return;
    }

    const payload = {
      firstName: this.createForm.value.firstName?.trim() ?? '',
      lastName: this.createForm.value.lastName?.trim() ?? '',
      email: this.createForm.value.email?.trim() ?? '',
      companyName: (this.createForm.value.companyName?.trim() || null) as string | null,
      password: this.createForm.value.password ?? ''
      // ⚠️ isActive НЕ го праќаме ако backend schema нема isActive на POST
    };

    this.loading = true;

    const s = this.api
      .createAdmin(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toast.show('Admin created successfully.', true, 2500, 'top-end');
          this.closeCreate();
          this.load();
        },
        error: (err) => this.handleHttpError(err, 'Save failed.')
      });

    this.sub.add(s);
  }

  openEdit(row: SuperadminAdminDto): void {
    if (!row?.id) return;

    this.editingId = row.id;
    this.editForm.reset({
      firstName: row.firstName ?? '',
      lastName: row.lastName ?? '',
      companyName: row.companyName ?? '',
      password: '' // празно = keep current
    });

    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.editingId = null;
  }

  submitEdit(): void {
    if (!this.editingId) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.toast.show('Please fix the form fields.', false, 3500, 'top-end');
      return;
    }

    const v = this.editForm.value;

    const payload: any = {
      firstName: v.firstName?.trim() ?? '',
      lastName: v.lastName?.trim() ?? '',
      companyName: (v.companyName?.trim() || null) as string | null
    };

    // password само ако е внесен
    if ((v.password ?? '').trim().length > 0) {
      payload.password = v.password;
    }

    this.loading = true;

    const s = this.api
      .updateAdmin(this.editingId, payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toast.show('Admin updated.', true, 2200, 'top-end');
          this.closeEdit();
          this.load();
        },
        error: (err) => this.handleHttpError(err, 'Update failed.')
      });

    this.sub.add(s);
  }

  deleteAdmin(row: SuperadminAdminDto): void {
    if (!row?.id) return;

    const ok = confirm(`Delete admin "${row.email}"?`);
    if (!ok) return;

    this.loading = true;

    const s = this.api
      .deleteAdmin(row.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toast.show('Admin deleted.', true, 2000, 'top-end');
          this.load();
        },
        error: (err) => this.handleHttpError(err, 'Delete failed.')
      });

    this.sub.add(s);
  }

  isTouchedInvalid(name: keyof CreateAdminForm['controls']): boolean {
    const c = this.createForm.controls[name];
    return !!(c.touched && c.invalid);
  }

  isTouchedInvalidEdit(name: keyof EditAdminForm['controls']): boolean {
    const c = this.editForm.controls[name];
    return !!(c.touched && c.invalid);
  }

  private handleHttpError(err: any, fallbackMsg: string) {
    const apiErrors = err?.error?.errors;

    // email exists special case
    const emailMsg = apiErrors?.email;
    if (emailMsg && typeof emailMsg === 'string' && /already exists/i.test(emailMsg)) {
      const emailControl = this.createForm?.controls?.email;
      if (emailControl) {
        emailControl.setErrors({ ...(emailControl.errors || {}), emailExists: true });
        emailControl.markAsTouched();
      }
      this.toast.show('Email already exists. Choose another email.', false, 4500, 'top-end');
      return;
    }

    if (apiErrors && typeof apiErrors === 'object') {
      const parts: string[] = [];
      for (const k of Object.keys(apiErrors)) parts.push(`${k}: ${String(apiErrors[k])}`);
      this.toast.show(parts.join(' • '), false, 4500, 'top-end');
      return;
    }

    const msg = err?.error?.message || err?.message || fallbackMsg;
    this.toast.show(String(msg), false, 4000, 'top-end');
  }
  
}
