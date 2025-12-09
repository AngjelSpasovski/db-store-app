import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-confirm-email',
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.scss']
})
export class ConfirmEmailComponent implements OnInit {
  state: 'working' | 'ok' | 'fail' = 'working';
  message = 'Confirming your email…';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    let token = this.route.snapshot.queryParamMap.get('token') || '';

    // fallback: ако стигне како /confirm-email/<token>
    if (!token) {
      const parts = location.pathname.split('/').filter(Boolean);
      const maybeToken = parts[parts.length - 1];
      if (maybeToken && maybeToken.length > 20) token = maybeToken;
    }

    if (!token) {
      this.state = 'fail';
      this.message = 'Missing token in URL.';
      return;
    }

    this.auth.confirmEmail(token).subscribe({
      next: () => {
        this.state = 'ok';
        this.message = 'Email confirmed. You can log in now.';
        setTimeout(() => this.router.navigate(['/login'], { queryParams: { tab: 'login' } }), 800);
      },
      error: (err) => {
        this.state = 'fail';
        this.message = err?.error?.message || 'Confirmation failed.';
      }
    });
  }
}
