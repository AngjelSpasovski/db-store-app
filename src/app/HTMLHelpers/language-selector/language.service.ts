// language.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly key = 'lang';
  private readonly supported = ['en','mk','it'] as const;

  private _lang$ = new BehaviorSubject<string>(this.initFromStorage());
  readonly language$ = this._lang$.asObservable();

  constructor(private i18n: TranslateService) {
    this.i18n.setDefaultLang('en');
    this.i18n.use(this._lang$.value);
  }

  /** тековен јазик (sync getter) */
  get current(): string { return this._lang$.value; }

  /** централен сеттер за јазик (ова е твоето "setLang") */
  set(lang: string): void {
    if (!this.supported.includes(lang as any)) lang = 'en';
    if (lang === this._lang$.value) return;

    this._lang$.next(lang);
    localStorage.setItem(this.key, lang);
    this.i18n.use(lang);
  }

  private initFromStorage(): string {
    return localStorage.getItem(this.key) || 'en';
  }
}
