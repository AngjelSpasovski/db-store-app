// src/app/user/buy-credits/credit.service.ts
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, map, catchError, throwError } from 'rxjs';

import { CREDITS_API } from '../../shared/tokens.api';
import type { CreditsApi } from '../../shared/credits.api';

import { UserPackagesApi, UserPackageDto } from '../../shared/user-packages.api';
import { CreditPackage } from './credit-packages.config';

@Injectable({ providedIn: 'root' })
export class CreditsService {
  private readonly creditsSubject = new BehaviorSubject<number>(0);
  readonly credits$ = this.creditsSubject.asObservable();

  constructor(
    @Inject(CREDITS_API) private api: CreditsApi,
    private userPackagesApi: UserPackagesApi
  ) {}

  refreshFromApi(): void {
    this.api.getMyCredits().subscribe({
      next: (value: number) => {
        const n = typeof value === 'number' ? value : 0;
        this.creditsSubject.next(n);
      },
      error: (err: unknown) => {
        console.error('Failed to load credits from API', err);
        this.creditsSubject.next(0);
      }
    });
  }

  get current(): number {
    return this.creditsSubject.value;
  }

  /** 🔹 Реални пакети од backend, мапирани во CreditPackage за UI */
  loadPackages(perPage = 50, page = 1): Observable<CreditPackage[]> {
    return this.userPackagesApi.getPackages(perPage, page).pipe(
      map(res => {
        // 1) земаме само активни
        const active = res.list.filter(p => p.isActive);

        // 2) сортирање по id ASC
        active.sort((a, b) => a.id - b.id);

        // 3) мапирање во CreditPackage
        return active.map(dto => this.mapDtoToCreditPackage(dto));
      }),
      catchError(err => {
        console.error('Failed to load user packages', err);
        return throwError(() => err);
      })
    );
  }


  private mapDtoToCreditPackage(dto: UserPackageDto): CreditPackage {
    return {
      id: `pkg-${dto.id}`,
      backendId: dto.id,
      name: dto.name,
      credits: dto.credits,
      // 300000 (cents) -> 3000
      price: dto.price / 100,
      discountPercentage: dto.discountPercentage ?? 0
    };
  }

}
