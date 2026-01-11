// src/app/auth/login/login.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth.service';
import { EmailJsService } from '../mail-server/emailjs.service';
import { Subscription, lastValueFrom, finalize, timer } from 'rxjs';
import { PdfCompressorService } from '../mail-server/pdf-compressor.service';
import { ToastService } from '../../shared/toast.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('signupForm', { static: false }) signupFormRef!: ElementRef<HTMLFormElement>;

  faEye       = faEye;
  faEyeSlash  = faEyeSlash;
  faArrowLeft = faArrowLeft;

  activeForm: 'login' | 'signup' = 'login';

  showPassword = false;
  showConfirmPassword = false;

  loginForm!: FormGroup;
  signupForm!: FormGroup;

  loginSubmitted = false;
  signupSubmitted = false;

  signupInProgress = false;
  signupError = '';

  selectedFileName: string | null = null;

  errorMessage: any;

  selectedFile?: File;
  serverErrorMsg = '';

  needsEmailVerify  = false;
  lastLoginEmail    = '';
  resendLoading     = false;
  infoMessage       = '';

  isSubmittingLogin = false;

  private sub!: Subscription;   // Subscription for logout event

  loginFailCount = 0;
  loginBlockedUntil = 0;            // timestamp (ms)
  loginBlockRemainingSec = 0;       // за UI
  private loginBlockSub?: Subscription;

  get isLoginBlocked(): boolean {
    return Date.now() < this.loginBlockedUntil;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private routeActive: ActivatedRoute,
    private translate: TranslateService,
    private auth: AuthService,
    private emailJs: EmailJsService,
    private pdfCompressor: PdfCompressorService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {

  // if token exists, redirect away from /login
  const token = this.auth.token;
  const u     = this.auth.currentUser$?.value || null;
  const role  = u?.role?.toLowerCase();
  const email = (u?.email || '').toLowerCase();

    // if tolken exists, redirect to user/buy-credits or admin based on role
  if (token && (role || email)) {
    const target =
    role === 'superadmin' ? '/admin' :
    /* adminuser и user одат исто */   '/user/buy-credits';

    this.router.navigateByUrl(target, { replaceUrl: true });
    return;
  }

    // Initialize forms
    this.loginForm = this.fb.group({
      email:                ['', [Validators.required, Validators.email]],
      password:             ['', [Validators.required, Validators.minLength(6)]],
      rememberMe:           [false]
    });

    this.signupForm = this.fb.group({
      // 1a. Column 1
      email:                ['',    [Validators.required, Validators.email]],
      name:                 ['',    Validators.required],
      surname:              ['',    Validators.required],
      password:             ['',    [Validators.required, Validators.minLength(6)]],
      confirmPassword:      ['',    Validators.required],

      // 1b. Column 2
      companyName:          ['',    Validators.required],
      companyAddress:       ['',    Validators.required],
      companyAddressSecond: [''],

      phoneNumber:          ['',    [Validators.required, Validators.pattern(/^\d{9,15}$/)]],   // 9–15 цифри
      vat:                  ['',    [Validators.required, Validators.pattern(/^\d{11}$/)]],     // IT: точно 11 цифри

      // 1c. Column 3
      city:                 ['',    Validators.required],
      state:                ['',    Validators.required],
      zip:                  ['',    Validators.required],
      role:                 ['',    Validators.required],
      file:                 [null,  Validators.required],

      // 2a. Checkbox
      privacyPolicy:        [false, Validators.requiredTrue],

      // consent #1 (required)
      consent1:             [false, Validators.requiredTrue],
      // consent #2 (required)
      consent2:             [false, Validators.requiredTrue],
      // consent #3 (optional)
      consent3:             [false],
      // consent #4 (optional)
      consent4:             [false],
      // consent #5 (optional)
      consent5:             [false]
    }, {
      validators: form => (
        form.get('password')!.value === form.get('confirmPassword')!.value
          ? null
          : { mismatch: true }
      )
    });

    this.digitsOnly('vat', 11);
    this.digitsOnly('phoneNumber', 15);

    // ✅ route -> tab sync (login vs signup)
    this.sub = new Subscription();

    // initial tab from route data
    this.sub.add(
      this.routeActive.data.subscribe(d => {
        const tab = (d['tab'] || 'login') as 'login' | 'signup';
        this.applyTab(tab);
      })
    );

    // ✅ твојот existing auth subscription
    this.sub.add(
      this.auth.isAuthed$.subscribe(isAuthed => {
        if (!isAuthed) {
          this.resetAllForms();
        }
      })
    );

  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.loginBlockSub?.unsubscribe();
  }

  get privacyPolicyUrl(): string {
    const lang = (this.translate.currentLang || 'en').toLowerCase();

    switch (lang) {
      case 'it':
        return 'assets/privacy/privacy-policy/privacy-policy-IT.pdf';
      case 'mk':
        return 'assets/privacy/privacy-policy/privacy-policy-MK.pdf';
      case 'en':
      default:
        return 'assets/privacy/privacy-policy/privacy-policy-EN.pdf';
    }
  }

  private startLoginBlockCountdown(untilMs: number) {
    this.loginBlockedUntil = untilMs;

    // чистење старо
    this.loginBlockSub?.unsubscribe();

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((this.loginBlockedUntil - Date.now()) / 1000));
      this.loginBlockRemainingSec = remaining;

      if (remaining <= 0) {
        this.loginBlockSub?.unsubscribe();
        this.loginBlockSub = undefined;
        this.loginBlockedUntil = 0;
        this.loginBlockRemainingSec = 0;
      }
    };

    // иницијално + секунда по секунда
    tick();
    this.loginBlockSub = timer(0, 1000).subscribe(tick);
  }

  private clearLoginBlock() {
    this.loginBlockSub?.unsubscribe();
    this.loginBlockSub = undefined;
    this.loginBlockedUntil = 0;
    this.loginBlockRemainingSec = 0;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  switchToLogin() {
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  switchToSignup() {
    this.router.navigateByUrl('/signup', { replaceUrl: true });
  }

  // LOGIN FORM
  onSubmitLogin() {
    this.loginSubmitted = true;
    if (this.loginForm.invalid) return;

    if (this.isLoginBlocked) {
      const secs = Math.ceil((this.loginBlockedUntil - Date.now()) / 1000);
      this.toast.warn(this.translate.instant('TOO_MANY_ATTEMPTS_WAIT', { secs }), { position: 'top-end' });
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;
    this.isSubmittingLogin = true; // ⟵ старт

    this.auth.signIn({ email, password }, !!rememberMe)
    .pipe(finalize(() => this.isSubmittingLogin = false))
    .subscribe({

      next: (res) => {
        // успешен login → ресетирај броење неуспеси
        this.clearLoginBlock();     // ✅ ресетирај блок ако успее
        this.loginFailCount = 0;    // ресетирај броење неуспеси

        // ресетирај состојби
        this.needsEmailVerify = false;

        // 1) ако има redirect query param, почитувај го
        const redirect = this.routeActive.snapshot.queryParamMap.get('redirect');
        if (redirect) {
          this.toast.success(this.translate.instant('LOGIN_SUCCESS'), { position: 'top-end' });
          this.router.navigateByUrl(redirect);
          return;
        }

        // 3) инаку по улога во /user/*
        const role = (res.user.role || 'user').toLowerCase();
        switch (role) {
          case 'superadmin': this.router.navigateByUrl('/admin'); break;
          // adminUser и user имаат ист дом
          default:           this.router.navigateByUrl('/user/buy-credits'); break;
        }
      },

      error: (err) => {
        // ако backend врати 429 
        if (err?.status === 429) {
          const retryAfter = Number(err?.headers?.get?.('Retry-After') || 30);
          this.startLoginBlockCountdown(Date.now() + retryAfter * 1000);

          this.toast.warn(
            this.translate.instant('TOO_MANY_ATTEMPTS_WAIT', { secs: retryAfter }),
            { position: 'top-end' }
          );
          return;
        }

        // UX backoff и без 429
        // ✅ UX локален cooldown (ако сакаш)
        this.loginFailCount++;
        if (this.loginFailCount >= 5) {
          this.startLoginBlockCountdown(Date.now() + 30_000); // 30s блокада
        }

        if (err?.status === 403 && (err?.error?.message || '').toLowerCase().includes('not verified')) {
          this.needsEmailVerify = true;
          this.lastLoginEmail = email;
          this.infoMessage = this.translate.instant('EMAIL_NOT_VERIFIED_INFO');
          this.toast.info(this.translate.instant('EMAIL_NOT_VERIFIED_INFO'), { position: 'top-end' });
          this.resendVerifyEmail(true);
          return;
        }

        const msg =
          err?.status === 0   ? this.translate.instant('TOAST.NETWORK_ERROR') :
          err?.status === 401 ? this.translate.instant('UNAUTHORIZED') :
          err?.error?.message || this.translate.instant('VALIDATION_FAILED');

        this.toast.error(msg, { position: 'top-end' });
      }
    });
  }

  resendVerifyEmail(auto = false) {
    if (!this.lastLoginEmail) return;
    this.resendLoading = true;

    this.auth.confirmEmailSend(this.lastLoginEmail).subscribe({
      next: () => {
        this.resendLoading = false;
        if (!auto) this.toast.info(this.translate.instant('EMAIL_NOT_VERIFIED_INFO'), { position: 'top-end' });
      },
      error: () => {
        this.resendLoading = false;
        if (!auto) this.toast.error(this.translate.instant('TOAST.SERVER_ERROR'), { position: 'top-end' });
      }
    });
  }

  // SIGNUP FORM
  onSubmitSignup(e: Event) {
    e.preventDefault();
    this.signupSubmitted = true;
    if (this.signupForm.invalid) {
      this.markAllAsTouched(this.signupForm);
      return;
    }

    this.signupInProgress = true;

    const v = this.signupForm.value;
    const stateOrNation = v.state; // за сега исто поле

    // 1) user (camelCase)
    const user = {
      email:       v.email,
      companyName: v.companyName,
      firstName:   v.name,
      lastName:    v.surname,
      password:    v.password,
      consent1:    !!v.consent1,
      consent2:    !!v.consent2,
      consent3:    !!v.consent3,
      consent4:    !!v.consent4,
      consent5:    !!v.consent5,
    };

    // 2) billingDetails (camelCase + backup keys)
    const billingDetailsCore: any = {
      email:          v.email,
      company:        v.companyName,
      companyName:    v.companyName,
      address1:       v.companyAddress,
      address2:       v.companyAddressSecond || undefined,
      buildingNumber: v.buildingNumber || undefined,
      buildingnumber: v.buildingNumber || undefined,
      zipCode:        v.zip,
      zipcode:        v.zip,
      city:           v.city,
      stateCode:      stateOrNation,
      statecode:      stateOrNation,
      nation:         stateOrNation,
      vatNumber:      String(v.vat ?? ''),
      vatnumber:      String(v.vat ?? ''),
    };

    // 3) payload
    const payload: any = {
      user,
      billingDetails: billingDetailsCore,
    };

    console.debug('SIGNUP payload:', payload);

    // 4) Backend sign-up (JSON)
    this.auth.signUp(payload).subscribe({
      next: async () => {
        this.toast.info(this.translate.instant('EMAIL_NOT_VERIFIED_INFO'), { position: 'top-end' });

        await this.handleEmailStepAndGoLogin();
        this.signupInProgress = false;
      },
      error: (err) => {
        this.signupInProgress = false;
        // човечка порака за тост
        const msg =
          err?.status === 0 ? this.translate.instant('TOAST.NETWORK_ERROR') :
          err?.status === 422 && err?.error?.errors
            ? this.flattenErrors(err.error.errors).join(' • ')
            : (err?.error?.message || this.translate.instant('TOAST.SERVER_ERROR'));

        this.toast.error(msg, { position: 'top-end' });
        this.signupError = msg;         // ако ти треба и под формата
        this.showApiErrors(err);        // (опционално) ако сакаше и старото поведение
      }
    });
  }

  // === Email чекор + секогаш префрлање на Login ===
  private async handleEmailStepAndGoLogin(): Promise<void> {
    try {
      const v = this.signupForm.value;

      const meta = {
        email:        v.email,
        companyName:  v.companyName,
        name:         v.name,
        surname:      v.surname,
        phoneNumber:  v.phoneNumber,
        city:         v.city,
        state:        v.state,
        zip:          v.zip,
        role:         v.role,
        vat:          v.vat,
        to_email:     'angjel.spasovski@gmail.com',
      };

      // ако нема PDF -> прати само meta
      if (!this.selectedFile) {
        await lastValueFrom(this.emailJs.sendSignupMetaOnly(meta));
        return;
      }

      // пробај да компресираш
      const fileToSend = await this.prepareFileForEmail(this.selectedFile);

      // ако падне под лимит -> прати со attachment
      if (fileToSend && fileToSend.size <= 48 * 1024) {
        await lastValueFrom(this.emailJs.sendSignupAttachment(fileToSend, meta));
        return;
      }

      // иначе -> meta-only (и логирај колку е голем)
      console.warn('PDF too large for EmailJS free limit:', fileToSend?.size);
      await lastValueFrom(this.emailJs.sendSignupMetaOnly(meta));
    } 
    catch (e) {
      console.warn('Email step failed (ignored):', e);
    } 
    finally {
      this.switchToLogin();
    }
  }

  // Компресија + fallback ако „компресираниот“ е поголем од оригинал
private async prepareFileForEmail(file: File): Promise<File | undefined> {
  try {
    console.log('original:', file.size);

    // Ако е веќе мал -> не го чепкај
    if (file.size <= 48 * 1024) return file;

    // Агресивни обиди (ова ќе деградира квалитет!)
    const attempts = [
      { maxBytes: 48 * 1024, quality: 0.35, scale: 0.60 },
      { maxBytes: 48 * 1024, quality: 0.28, scale: 0.55 },
      { maxBytes: 48 * 1024, quality: 0.22, scale: 0.50 },
    ];

    for (const a of attempts) {
      const cmp = await this.pdfCompressor.compress(file, a);
      console.log('attempt:', a, '=>', cmp.size);
      if (cmp.size <= 48 * 1024) return cmp;
    }

    // ако не успее -> врати најмало (или undefined)
    const last = await this.pdfCompressor.compress(file, { maxBytes: 120 * 1024, quality: 0.30, scale: 0.60 });
    return last.size < file.size ? last : file;
  } 
  catch (err) {
    console.warn('PDF compress failed:', err);
    return file;
  }
}

  // Handle file selection for signup
  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file  = input.files?.[0] || null;
    const fc    = this.signupForm.get('file');

    // ако нема ништо избрано → ресетирај form control
    if (!file) {
      this.selectedFile = undefined;
      this.selectedFileName = '';
      fc?.reset();               // ќе активира required
      return;
    }

    const isPdf   = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const maxSize = 5 * 1024 * 1024; // 5MB

    // тип
    if (!isPdf) {
      this.selectedFile = undefined;
      this.selectedFileName = '';
      fc?.setValue(null);
      fc?.setErrors({ invalidFileType: true });
      fc?.markAsTouched();
      fc?.updateValueAndValidity({ onlySelf: true });
      input.value = ''; // дозволи повторен избор на ист фајл
      this.toast.warn(this.translate.instant('ONLY_PDF'), { position: 'top-end' });
      return;
    }

    // големина
    if (file.size > maxSize) {
      this.selectedFile = undefined;
      this.selectedFileName = '';
      fc?.setValue(null);
      fc?.setErrors({ fileTooLarge: true });
      fc?.markAsTouched();
      fc?.updateValueAndValidity({ onlySelf: true });
      input.value = '';
      this.toast.warn('Max size is 5MB.', { position: 'top-end' });
      return;
    }

    // валиден избор → зачувај и „помини“ required
    this.selectedFile = file;
    this.selectedFileName = file.name;

    // доволно е да сетираш било која truthy вредност (file или file.name)
    fc?.setValue(file.name);
    fc?.setErrors(null);
    fc?.markAsDirty();
    fc?.markAsTouched();
    fc?.updateValueAndValidity({ onlySelf: true });
  }

  clearSelectedFile(input: HTMLInputElement) {
    const fc = this.signupForm.get('file');

    this.selectedFile = undefined;
    this.selectedFileName = '';

    // исчисти form control-от без да форсираш грешка веднаш
    fc?.reset();                 // value -> null, validators остануваат
    fc?.setErrors(null);
    fc?.markAsPristine();
    fc?.markAsUntouched();
    fc?.updateValueAndValidity({ onlySelf: true });

    // дозволи повторно да го изберат истиот фајл
    if (input) input.value = '';
  }

  goBackToHomePage() {
    this.resetAllForms();
    this.router.navigate(['/home']);
  }

  goToForgotPassword() {
    this.resetAllForms();
    this.router.navigate(['/forgot-password']);
  }

  resetAllForms(): void {
    this.loginSubmitted = false;
    this.signupSubmitted = false;

    // Reset login form
    this.loginForm.reset({
      email: '',
      password: '',
      rememberMe: false
    });

    // Reset signup form
    this.signupForm.reset({
      email: '',
      name: '',
      surname: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      companyAddress: '',
      vat: '',
      phoneNumber: '',
      role: '',
      privacyPolicy: false,
      file: null,
      consent1: false,
      consent2: false,
      consent3: false,
      consent4: false,
      consent5: false
    });
  }

  getError(form: FormGroup, name: string): string {
    const c = form.get(name)!;
    if (!c.touched) return '';

    if (c.errors?.['required']) {
      return this.translate.instant('FIELD_REQUIRED', { field: this.translate.instant(name.toUpperCase()) });
    }
    if (c.errors?.['email']) {
      return this.translate.instant('EMAIL_INVALID');
    }
    if (c.errors?.['minlength']) {
      return this.translate.instant('MIN_LENGTH_REQUIRED', { min: c.errors['minlength'].requiredLength });
    }
    if (c.errors?.['pattern']) {
      return this.translate.instant('PATTERN_INVALID');
    }
    if (name === 'file' && c.errors?.['invalidFileType']) {
      return this.translate.instant('ONLY_PDF');
    }
    if (name === 'confirmPassword' && form.errors?.['mismatch']) {
      return this.translate.instant('PASSWORD_MISMATCH');
    }
    if ((name === 'consent1' || name === 'consent2') && c.errors?.['required']) {
      return this.translate.instant('FIELD_REQUIRED', { field: this.translate.instant(name.toUpperCase()) });
    }
    return '';
  }

  private flattenErrors(obj: any): string[] {
    if (!obj) return [];
    const out: string[] = [];
    Object.entries(obj).forEach(([k, v]) => {
      if (Array.isArray(v)) out.push(`${k}: ${v.join(', ')}`);
      else if (typeof v === 'string') out.push(`${k}: ${v}`);
      else if (typeof v === 'object') out.push(...this.flattenErrors(v));
    });
    return out;
  }

  showApiErrors(err: any) {
    if (err?.status === 422 && err?.error?.errors) {
      this.serverErrorMsg = this.flattenErrors(err.error.errors).join('\n');
    }
    else if (err?.status === 0) {
      this.serverErrorMsg = this.translate.instant('TOAST.NETWORK_ERROR');
    }
    else {
      this.serverErrorMsg = err?.error?.message || this.translate.instant('TOAST.SERVER_ERROR');
    }
    console.error('API error:', err, this.serverErrorMsg);
    this.toast.error(this.serverErrorMsg, { position: 'top-end' });  // 🔔 тост
  }

  private markAllAsTouched(group: FormGroup) {
    Object.values(group.controls).forEach(c => {
      // @ts-ignore
      if (c.controls) this.markAllAsTouched(c as FormGroup);
      c.markAsTouched();
    });
  }

  // input sanitizers for numeric-only fields
  private digitsOnly(controlName: string, maxLen: number) {
    const c = this.signupForm.get(controlName);
    c?.valueChanges.subscribe(v => {
      if (v == null) return;
      const cleaned = String(v).replace(/\D+/g, '').slice(0, maxLen);
      if (cleaned !== v) c?.setValue(cleaned, { emitEvent: false });
    });
  }

  private applyTab(tab: 'login' | 'signup') {
    if (this.activeForm !== tab) {
      this.activeForm = tab;
    }
    this.resetAllForms();
  }

}