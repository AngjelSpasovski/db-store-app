import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth.service';
import { ToastService } from '../../shared/toast.service';

type Step = 'request' | 'verifying' | 'reset' | 'done' | 'error';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    FontAwesomeModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  public faArrowLeft = faArrowLeft;

  // UI state
  public isLoading = false;

  // form fields
  public email = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
  // Ако некој стигне тука со token во URL, префрли го на правилната страница
  const token = this.route.snapshot.queryParamMap.get('token') || '';
  if (token) {
    this.router.navigate(['/reset-password'], { queryParams: { token } });
    return;
  }
}

  // Methods for each step
  sendResetEmail(): void {
    if (!this.email) return;
    this.isLoading = true;

    this.auth.resetPasswordSend(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.show('We sent you an email with a reset link.', true, 4000, 'top-end');
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || 'Failed to send reset email.';
        this.toast.show(msg, false, 6000, 'top-end'); // ⟵ error toast
      }
    });
  }

  goBackToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { tab: 'login' } });
  }
}
