import { Observable } from 'rxjs';

export abstract class CreditsApi {
  abstract getMyCredits(): Observable<number>;
}