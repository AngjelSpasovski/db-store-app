// src/app/HTMLHelpers/language-selector/language.service.ts
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

const STORAGE_KEY = 'selectedLanguage';
const FALLBACK = 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private _lang$ = new BehaviorSubject<string>(localStorage.getItem(STORAGE_KEY) || FALLBACK);
  readonly language$ = this._lang$.asObservable();

  constructor(private i18n: TranslateService, @Inject(DOCUMENT) private doc: Document) {
    this.i18n.setDefaultLang(FALLBACK);
    this.apply(this._lang$.value);
  }

  /** Јавно менување јазик (перзистира + аплицира) */
  set(lang: string) {
    if (!lang || lang === this._lang$.value) return;
    localStorage.setItem(STORAGE_KEY, lang);
    this._lang$.next(lang);
    this.apply(lang);
  }

  /** Тековен јазик (синхрон) */
  current() { return this._lang$.value; }

  /** Внатрешно: активирање на преводите + <html lang=".."> */
  private apply(lang: string) {
    this.i18n.use(lang);
    this.doc.documentElement.lang = lang;
  }
}
