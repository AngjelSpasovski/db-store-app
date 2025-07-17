import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthService, User  } from '../auth.service';
import { EmailJsService } from '../mail-server/emailjs.service';
import { Subscription } from 'rxjs';

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
  private sub!: Subscription;   // Subscription for logout event


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private auth: AuthService,
    private emailJs: EmailJsService
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit(): void {
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

    this.sub = this.auth.logoutEvent.subscribe(() => {
      this.resetAllForms();
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
    console.log('📤 onSubmitLogin fired:', this.loginForm.value);

    this.loginSubmitted = true;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;

    console.log('🔑 Calling AuthService.login with', email, password, rememberMe);

    this.auth.login(email, password, rememberMe).subscribe({
      next: user => {
        console.log('✅ AuthService.login succeeded, redirecting…');
        // ✅ On successful login, navigate to User page
        this.router.navigate(['/user']);
      },
      error: err => {
        // ❌ Display login error
        this.errorMessage = err.message || 'Login failed';
        alert(this.errorMessage);
      }
    });
  }

  // SIGNUP FORM
  onSubmitSignup(evt: Event) {
    console.log('📤 onSubmitSignup fired:', this.loginForm.value);
    // спречува default HTML submit
    evt.preventDefault();
  
    // корисничката реакција
    this.signupSubmitted = true;
    this.signupForm.markAllAsTouched();
    if (this.signupForm.invalid) return;
  
    this.signupInProgress = true;
    this.signupError = '';
  
    const name     = this.signupForm.value.name;
    const email    = this.signupForm.value.email;
    const password = this.signupForm.value.password;
    const role     = 'user'

    // Повик на AuthService.register()
    this.auth.register(name, email, password).subscribe({
      next: (newUser: User) => {
        // Регистрација успешна – AuthService го додаде во sessionStorage под „users“

        // (Опционално) Ако сакаш веднаш да најавиш корисник:
        this.auth.login(email, password, false).subscribe({
          next: loggedIn => {
            this.router.navigate(['/user']);
          },
          error: err => {
            // Ако логирањето веднаш по регистрацијата не е критично, може само да го прескокнеш
            console.error('Login after register failed', err);
            this.router.navigate(['/login'], { queryParams: { tab: 'login' } });
          }
        });
      },
      error: (err: Error) => {
        // На пример: ако е-mail веќе постои
        this.signupError = err.message;
        this.signupInProgress = false;
      }
    });

    // event.target е HTMLFormElement
    const formEl = evt.target as HTMLFormElement;
    
    console.log('FORM DATA:');
    const formData = new FormData(formEl);
    formData.forEach((value, key) => {
      console.log(key, value);
    });

    // прати го кон EmailJS
    this.emailJs.sendWithAttachment(formEl)
      .then(() => {
        debugger;
        console.log("Successful email send to emailJs");
        //this.router.navigate(['/user']);
      })
      .catch(err => {
        console.error('EmailJS error', err);
        //this.router.navigate(['/home']);
      })
      .finally(() => {
        this.signupInProgress = false;
      });
  }
  

  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;

    if (input.files && input.files.length) {
      const file = input.files[0];
      // Проверка: дали е PDF
      if (file.type !== 'application/pdf') {
        // Ако не е PDF, сетирај custom грешка
        this.signupForm.get('file')?.setErrors({ invalidFileType: true });
        this.selectedFileName = null;
        // Испразни вредноста
        this.signupForm.patchValue({ file: null });
        return;
      }

      // Ако е валиден PDF, го чуваш
      this.selectedFileName = file.name;
      this.signupForm.patchValue({ file });
      this.signupForm.get('file')!.updateValueAndValidity();
    } 
    else {
      // ако корисникот кликне "Cancel"
      this.selectedFileName = null;
      this.signupForm.patchValue({ file: null });
      this.signupForm.get('file')!.updateValueAndValidity();
    }
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

    /**
     * * Resetting the form values to empty strings or null is important to ensure that the form is in a clean state
     * * when the user switches between forms.
     * * with reset() automatically clears the touched/dirty states of the controls
     * * and sets the form to its initial state.
     * *
     */
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
      // Можеш да смислиш посебна порака или да ја искористиш FIELD_REQUIRED
      return this.translate.instant('FIELD_REQUIRED', { field: this.translate.instant(name.toUpperCase()) });
    }
    return '';
  }
}
