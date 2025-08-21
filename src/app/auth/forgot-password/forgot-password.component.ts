import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    private toast: ToastService,
    private translate: TranslateService
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
    
    // Call the service to send reset email
    this.auth.resetPasswordSend(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        // info toast
        this.toast.info(this.translate.instant('RESET_PASSWORD_LINK'), { position: 'top-end' });
      },
      error: (err) => {
        this.isLoading = false;

        // Handle common errors
        if (err?.status === 0) {
          this.toast.error(this.translate.instant('TOAST.NETWORK_ERROR'), { position: 'top-end' });
          return;
        }
        // If email not found, show specific message
        if (err?.status === 404) {
          this.toast.warn(this.translate.instant('EMAIL_NOT_FOUND'), { position: 'top-end' });
          return;
        }

        // For other errors, show generic message
        const msg = err?.error?.message || this.translate.instant('VALIDATION_FAILED');
        // Show error toast
        this.toast.error(msg, { position: 'top-end', duration: 6000 });
      }
    });
  }

  // Navigate back to login
  goBackToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { tab: 'login' } });
  }
}
