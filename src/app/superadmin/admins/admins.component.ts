// scr/app/superadmin/admins/admins.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import { SuperadminAdminsApi, SuperadminAdminDto } from '../../shared/superadmin-admins.api';
import { ToastService } from '../../shared/toast.service';

type CreateAdminForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  companyName: FormControl<string>;
  password: FormControl<string>;
  isActive: FormControl<boolean>;
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

  private sub = new Subscription();

  constructor(
    private api: SuperadminAdminsApi,
    private fb: FormBuilder,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.nonNullable.group({
      firstName: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
      lastName: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(120)]),
      companyName: this.fb.nonNullable.control(''),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]),
      isActive: this.fb.nonNullable.control(true)
    });

    // ✅ ако бекенд ти даде emailExists, чисти го веднаш кога user ќе смени email
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
      password: '',
      isActive: true
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
      password: this.createForm.value.password ?? '',
      isActive: !!this.createForm.value.isActive
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

  private handleHttpError(err: any, fallbackMsg: string) {
    const apiErrors = err?.error?.errors;

    // ✅ Специјален случај: email already exists -> inline error + toast
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

    // ✅ генерално прикажување на бекенд validation errors
    if (apiErrors && typeof apiErrors === 'object') {
      const parts: string[] = [];
      for (const k of Object.keys(apiErrors)) {
        parts.push(`${k}: ${String(apiErrors[k])}`);
      }
      this.toast.show(parts.join(' • '), false, 4500, 'top-end');
      return;
    }

    const msg = err?.error?.message || err?.message || fallbackMsg;
    this.toast.show(String(msg), false, 4000, 'top-end');
  }
}
