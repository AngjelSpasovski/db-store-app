import { Injectable } from '@angular/core';
import { CreditsApi } from './credits.api';
import { Observable, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class LocalCreditsApi extends CreditsApi {

  constructor(private auth: AuthService) { super(); }

  getMyCredits(): Observable<number> {
    const user = this.auth.getCurrentUser();
    if (!user) return of(0);
    
    const key = `credits_${user.email}`;
    
    return of(+(sessionStorage.getItem(key) ?? '0'));
  }
}
