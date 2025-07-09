import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DummyIdService {
  // List of valid national IDs
  private validIds = [
    '12345678910',
    '10020030040',
    '20030040050',
    '30040050060'
  ];

  /**
   * Returns true if the given ID exists in our dummy list.
   */
  exists(id: string): boolean {
    return this.validIds.includes(id.trim());
  }
}