import { Injectable } from '@angular/core';

export interface SearchRecord {
  id: string;
  timestamp: string;
  success: boolean;
  fileUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private storageKey = 'app_search_history';

  /** Get all records in insertion order (newest first) */
  getAll(): SearchRecord[] {
    const raw = sessionStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  /** Add a new record to history */
  add(record: SearchRecord): void {
    const list = this.getAll();
    list.unshift(record);
    sessionStorage.setItem(this.storageKey, JSON.stringify(list));
  }
}