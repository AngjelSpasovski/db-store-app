// src/app/shared/http-loading.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HttpLoadingService {
  private _inflight = new BehaviorSubject<number>(0);
  readonly inflight$ = this._inflight.asObservable();
  readonly isLoading$ = this.inflight$.pipe(
    map(n => n > 0),
    distinctUntilChanged()
  );

  inc() { this._inflight.next(this._inflight.value + 1); }
  dec() { this._inflight.next(Math.max(0, this._inflight.value - 1)); }
}
