// src/app/user/new-research/new-search-history.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataRequestApi, DataRequestRow } from 'src/app/shared/data-request.api';

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private historySubject = new BehaviorSubject<DataRequestRow[]>([]);
  readonly history$ = this.historySubject.asObservable();

  constructor(private dataReqApi: DataRequestApi) {}

  /**
   * Ги вчитува сите data-requests од backend
   * и ги сортира по createdAt (најновите најгоре).
   */
  reload(): void {
    this.dataReqApi.listMyRequests().subscribe({
      next: (rows) => {
        const sorted = [...rows].sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        });

        //console.log('[DataRequests] list response ➜', sorted);
        this.historySubject.next(sorted);
      },
      error: (err) => {
        //console.error('[DataRequests] list failed', err);
        this.historySubject.next([]);
      }
    });
  }
}
