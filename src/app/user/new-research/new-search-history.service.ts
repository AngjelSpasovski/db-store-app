import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SearchRecord {
  id:        string;
  timestamp: string;
  success:   boolean;
  fileUrl?:  string;
}

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private storageKey = 'app_search_history';

  // 1) load initial list from sessionStorage
  private historySubject = new BehaviorSubject<SearchRecord[]>(
    JSON.parse(sessionStorage.getItem(this.storageKey) || '[]')
  );
  /** Exposed observable the components can subscribe to */
  public history$ = this.historySubject.asObservable();

  /** Add a new record to history and emit updated list */
  add(record: SearchRecord): void {
    const list = [record, ...this.historySubject.value];
    sessionStorage.setItem(this.storageKey, JSON.stringify(list));
    this.historySubject.next(list);
  }

  /** (Optional) helper to pull the current snapshot */
  getAll(): SearchRecord[] {
    return this.historySubject.value;
  }
}
