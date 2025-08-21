import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth.service';
import { EmailJsService } from '../mail-server/emailjs.service';
import { Subscription, lastValueFrom } from 'rxjs';
import { PdfCompressorService } from '../mail-server/pdf-compressor.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule
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
  
  private sub!: Subscription;   // Subscription for logout event

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

    // if tolken exists, redirect to user/buy-credits
    const token = this.auth.token;
    const role  = this.auth.currentUser$.value?.role?.toLowerCase();
    if (token && role) {
      const target = role === 'superadmin' ? '/user/superadmin' : role === 'admin' ? '/user/admin' : '/user/buy-credits';
      this.router.navigateByUrl(target);
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
      
      phoneNumber:          ['',    [Validators.required, Validators.pattern(/^\d{10}$/)]],
      vat:                  ['',    [Validators.required, Validators.pattern(/^\w{11}$/)]],
  
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

    // Секогаш кога LoginComponent се активира, постави login таб и ресетирај ги формите
    this.activeForm = 'login';
    this.resetAllForms();

    this.sub = this.auth.isAuthed$.subscribe(isAuthed => {
      if (!isAuthed) {
        this.resetAllForms();
      }
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  switchToLogin() {
    this.activeForm = 'login';
    this.resetAllForms();
  }

  switchToSignup() {
    this.activeForm = 'signup';
    this.resetAllForms();
  }

  // LOGIN FORM
  onSubmitLogin() {
    this.loginSubmitted = true;
    if (this.loginForm.invalid) return;

    const { email, password, rememberMe } = this.loginForm.value;

  this.auth.signIn({ email, password }, !!rememberMe).subscribe({
    next: (res) => {
      this.needsEmailVerify = false;

      // 1) respect redirect
      const redirect = this.routeActive.snapshot.queryParamMap.get('redirect');
      if (redirect) {
        this.toast.success(this.translate.instant('LOGIN_SUCCESS'), { position: 'top-end' });
        this.router.navigateByUrl(redirect);
        return;
      }

      // 2) role-based route
      const role = (res.user.role || 'user').toLowerCase();
      switch (role) {
        case 'superadmin':
          this.router.navigateByUrl('/user/superadmin');
          break;
        case 'admin':
          this.router.navigateByUrl('/user/admin');
          break;
        default:
          this.router.navigateByUrl('/user/buy-credits');
      }
      this.toast.success(this.translate.instant('LOGIN_SUCCESS'), { position: 'top-end' });
    },
    error: err => {
      // 403 not verified → UI + инфо-тост
      if (err?.status === 403 && (err?.error?.message || '').toLowerCase().includes('not verified')) {
        this.needsEmailVerify = true;
        this.lastLoginEmail = email;
        this.infoMessage = this.translate.instant('EMAIL_NOT_VERIFIED_INFO');
        this.toast.info(this.translate.instant('EMAIL_NOT_VERIFIED_INFO'), { position: 'top-end' });
        this.resendVerifyEmail(true);
        return;
      }

      // останати грешки (login екран сме, па прикажи експлицитно тост)
      const msg =
        err?.status === 0 ? this.translate.instant('TOAST.NETWORK_ERROR') :
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
    if (this.signupForm.invalid) return;

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
        // побарај backend да прати верификациски е-мејл
        const v = this.signupForm.value;
        this.auth.confirmEmailSend(v.email).subscribe({
          next: () => console.log('Confirm e-mail sent'),
          error: (e) => console.warn('Confirm e-mail send failed (ignored):', e)
        });

        // 🔔 инфо-тост: кажи му на корисникот што следува
        this.toast.info(this.translate.instant('EMAIL_NOT_VERIFIED_INFO'), { position: 'top-end' });

        await this.handleEmailStepAndGoLogin();
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

      // Ако нема фајл – готово
      if (!this.selectedFile) return;

      let fileToSend = await this.prepareFileForEmail(this.selectedFile);

      // EmailJS free лимит е ~50KB; ако е над – скипни attach (не блокирај UX)
      if (fileToSend && fileToSend.size <= 48 * 1024) {
        await lastValueFrom(this.emailJs.sendSignupAttachment(fileToSend, {
          email:       v.email,
          companyName: v.companyName,
          name:        v.name,
          surname:     v.surname,
          phoneNumber: v.phoneNumber,
          city:        v.city,
          state:       v.state,
          zip:         v.zip,
          role:        v.role,
          vat:         v.vat,
        }));
      } else {
        console.warn('PDF over EmailJS free limit (~50KB) – skipping attachment');
        // опција: тука можеш да повикаш template без attachment или да пратиш само meta
      }
    } catch (e) {
      console.warn('Email step failed (ignored):', e);
    } finally {
      // КЛУЧНО: секогаш префрли се на Login
      this.switchToLogin();
    }
  }

  // Компресија + fallback ако „компресираниот“ е поголем од оригинал
  private async prepareFileForEmail(file?: File): Promise<File | undefined> {
    if (!file) return undefined;
    try {
      console.log('original:', file.size, 'bytes');
      const cmp = await this.pdfCompressor.compress(file, {
        maxBytes: 380 * 1024,
        quality : 0.58,
        scale   : 0.9
      });
      const chosen = (cmp.size < file.size) ? cmp : file;
      console.log('chosen to send:', chosen.size, 'bytes');
      return chosen;
    } catch (err) {
      console.warn('PDF compress failed, using original', err);
      return file;
    }
  }

  // Handle file selection for signup
  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const maxSize = 5 * 1024 * 1024;

    if (!isPdf) {
      this.signupForm.get('file')?.setErrors({ invalidFileType: true });
      this.selectedFileName = '';
      this.selectedFile = undefined;
      this.toast.warn(this.translate.instant('ONLY_PDF'), { position: 'top-end' });
      return;
    }
    if (file.size > maxSize) {
      this.signupForm.get('file')?.setErrors({ fileTooLarge: true });
      this.selectedFileName = '';
      this.selectedFile = undefined;
      this.toast.warn('Max size is 5MB.', { position: 'top-end' });
      return;
    }

    this.signupForm.get('file')?.setErrors(null);
    this.selectedFile = file;
    this.selectedFileName = file.name;
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
      return 'Only PDF files are allowed.';
    }
    if (name === 'confirmPassword' && form.errors?.['mismatch']) {
      return this.translate.instant('PASSWORDS_DO_NOT_MATCH');
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

}
