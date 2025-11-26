import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { startWith } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { UserService, UserDetailsDTO } from '../user.service';
import { ToastService } from '../../shared/toast.service';
import { CreditsService } from '../buy-credits/credit.service';
import type { AuthUser } from '../../auth/auth.service';
import { InvoiceApi, InvoiceDto } from '../../shared/invoice.api';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    ReactiveFormsModule,
    FontAwesomeModule,
    TranslateModule
  ],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {

  faEye = faEye;
  faEyeSlash = faEyeSlash;
  showPass = false;
  showConfirm = false;

  loading = false;
  saving = false;
  editMode = false;

  data: UserDetailsDTO | null = null;
  form!: FormGroup; // non-null

  invoices: InvoiceDto[] = [];

  public currentUser: AuthUser | null = null;
  public currentCredits = 0;                      // ← Current credits from session storage
  public credits$ = this.creditsSvc.credits$;     // ← Observable на кредити

  constructor(
    private auth: AuthService,
    private api: UserService,
    private toast: ToastService,
    private translate: TranslateService,
    private fb: FormBuilder,
    private creditsSvc: CreditsService,
    private invoiceApi: InvoiceApi
  ) { }

  ngOnInit(): void {
    this.refresh();

    // init credits од sessionStorage (како што веќе имаш)
    const user: AuthUser | null = this.auth.getCurrentUser();
    if (user) {
      const key = `credits_${user.email}`;
      const stored = sessionStorage.getItem(key);
      this.currentCredits = stored ? +stored : 0;
    }

    // да си ги вчитаме сите invoices
    this.loadInvoices();
  }

  private loadInvoices(): void {
    this.invoiceApi.listMyInvoices().subscribe({
      next: (list) => {
        this.invoices = list || [];
      },
      error: (err) => {
        console.error('Failed to load invoices', err);
      }
    });
  }

  enableEdit() {
    if (!this.data) return;
    const u = this.data.user;

    this.form = this.fb.group(
      {
        firstName: [u.firstName ?? '', [Validators.required, Validators.maxLength(60)]],
        lastName: [u.lastName ?? '', [Validators.required, Validators.maxLength(60)]],
        companyName: [u.companyName ?? '', [Validators.maxLength(120)]],
        password: ['', [Validators.minLength(8)]],
        confirm: ['']
      },
      { validators: this.matchIfProvided('password', 'confirm') } // +++
    );

    // dynamic: ако има password, confirm станува required
    this.f('password').valueChanges.pipe(startWith(this.f('password').value))
      .subscribe((v: string) => {
        const c = this.f('confirm');
        if (v && v.length > 0) {
          c.addValidators([Validators.required]);
        } else {
          c.clearValidators();
        }
        c.updateValueAndValidity({ emitEvent: false });
      });

    this.editMode = true;
  }

  cancelEdit() {
    this.editMode = false;
    this.showPass = this.showConfirm = false;
    if (this.form && this.data) {
      const u = this.data.user;
      this.form.reset({ firstName: u.firstName ?? '', lastName: u.lastName ?? '', companyName: u.companyName ?? '', password: '', confirm: '' }, { emitEvent: false });
    }
  }

  save() {
    if (!this.form || !this.data) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();   // покажи пораки веднаш
      return;
    }
    if (!this.form.dirty) {           // нема промени → нема повик
      this.editMode = false;
      return;
    }

    this.saving = true;
    const { firstName, lastName, companyName, password } = this.form.value;
    const body: any = { firstName: firstName?.trim(), lastName: lastName?.trim(), companyName: companyName?.trim() };
    if (password?.trim()?.length >= 8) body.password = password.trim();

    this.api.updateMe(body)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => { this.toast.success('Profile updated', { position: 'top-end' }); this.editMode = false; this.refresh(); },
        error: () => this.toast.error('Update failed', { position: 'top-end' })
      });
  }

  private matchIfProvided(pwdKey: string, confirmKey: string) {
    return (fg: FormGroup) => {
      const pwd = fg.get(pwdKey)?.value ?? '';
      const conf = fg.get(confirmKey)?.value ?? '';
      if (!pwd && !conf) return null;
      return pwd === conf ? null : { mismatch: true };
    };
  }


  fullName() {
    const u = this.data?.user;
    return u ? `${u.firstName} ${u.lastName}`.trim() : '—';
  }

  // helpers
  f(name: string) { return this.form!.get(name)!; }

  refresh() {
    this.loading = true;
    this.api.getMeDetails()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: d => {
          this.data = d;
          this.credits$ = this.creditsSvc.credits$;
          console.log(this.credits$);
        },
        error: () => this.toast.error('Failed to load account details', { position: 'top-end' })
      });
  }

  /**
 * Го враќа најновиот SUCCESS invoice за даден packageId (ако постои и има receiptUrl).
 */
  findInvoiceForPackage(packageId: number | undefined | null): InvoiceDto | null {
    if (!packageId) return null;

    const candidates = this.invoices.filter(inv =>
      inv.packageId === packageId &&
      inv.status === 'SUCCESS' &&
      !!inv.receiptUrl
    );

    if (!candidates.length) return null;

    // земи го најновиот по createdAt
    candidates.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return candidates[candidates.length - 1];
  }

  openInvoice(inv: InvoiceDto | null | undefined): void {
    if (!inv?.receiptUrl) {
      this.toast.error('Invoice not available for this package.');
      return;
    }
    window.open(inv.receiptUrl, '_blank', 'noopener');
  }

}
