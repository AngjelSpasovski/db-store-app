import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../auth.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    TranslateModule
  ],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  state: 'verifying' | 'ok' | 'fail' | 'saving' | 'done' = 'verifying';
  form!: FormGroup;
  token = '';
  message = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm:  ['', Validators.required],
    }, {
      validators: group => group.get('password')!.value === group.get('confirm')!.value
        ? null : { mismatch: true }
    });

    this.token = this.route.snapshot.queryParamMap.get('token') || '';
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
        this.toast.show('Password changed successfully.', true, 4000, 'top-end');
      },
      error: () => {
        this.state = 'ok';
        const msg = 'Could not change password. Please try again.';
        this.toast.show(msg, false, 6000, 'top-end'); // ⟵ error toast
      }
    });
  }
}
