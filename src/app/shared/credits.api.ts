// src/app/shared/credits.api.ts
import { Observable } from 'rxjs';

export interface CreditsApi {
  getMyCredits(): Observable<number>;
}
