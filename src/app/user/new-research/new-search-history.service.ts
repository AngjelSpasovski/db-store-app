// src/app/user/new-research/new-search-history.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SearchRecord {
  id: string;
  timestamp: string;
  success: boolean;
  fileUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private storageKey = 'app_search_history';

  private historySubject = new BehaviorSubject<SearchRecord[]>(
    this.loadFromStorage()
  );
  public history$ = this.historySubject.asObservable();

  add(record: SearchRecord): void {
    const list = [record, ...this.historySubject.value];
    sessionStorage.setItem(this.storageKey, JSON.stringify(list));
    this.historySubject.next(list);
  }

  getAll(): SearchRecord[] {
    return this.historySubject.value;
  }

  private loadFromStorage(): SearchRecord[] {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
