import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    TranslateModule,
    FontAwesomeModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  public faArrowLeft = faArrowLeft;
  public state: 'verifying' | 'ok' | 'fail' | 'saving' | 'done' = 'verifying';
  public form!: FormGroup;
  public token = '';
  public message = '';

  constructor(
    private fb: FormBuilder,
    private routeActive: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm:  ['', Validators.required],
    }, {
      validators: group => group.get('password')!.value === group.get('confirm')!.value
        ? null : { mismatch: true }
    });

    this.token = this.routeActive.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.state = 'fail';
      this.message = 'Missing or invalid token.';
      return;
    }

    this.auth.resetPasswordVerify(this.token).subscribe({
      next: () => { 
        this.state = 'ok'; 
      },
      error: () => {
        this.state = 'fail';
        this.message = 'Reset link is invalid or expired.';
        this.toast.warn('Reset link is invalid or expired.', { position: 'top-end' });
      }
    });
  }

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid || this.state !== 'ok') return;
    this.state = 'saving';

    this.auth.resetPasswordSet(this.token, this.f['password'].value).subscribe({
      next: () => {
        this.state = 'done';
        // success тост (зелено)
        this.toast.success(this.translate.instant('PASSWORD_UPDATED'), { position: 'top-end' });
      },
      error: (err) => {
        this.state = 'ok';

        if (err?.status === 0) {
          this.toast.error(this.translate.instant('TOAST.NETWORK_ERROR'), { position: 'top-end' });
          return;
        }

        const msg = err?.error?.message || this.translate.instant('VALIDATION_FAILED');
        this.toast.error(msg, { position: 'top-end', duration: 6000 });
      }
    });
  }

  // Navigate back to login
  goBackToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { tab: 'login' } });
  }

}
