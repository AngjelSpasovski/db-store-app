// src/app/shared/loading-bar.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingBarService {
  private _isLoading$ = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this._isLoading$.asObservable();

  private counter = 0;

  start(): void {
    if (++this.counter === 1) this._isLoading$.next(true);
  }

  stop(): void {
    if (this.counter > 0 && --this.counter === 0) this._isLoading$.next(false);
  }
}