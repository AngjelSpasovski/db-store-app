// src/app/HTMLHelpers/language-selector/language.service.ts
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

export type LangCode = 'en' | 'it' | 'mk';

const STORAGE_KEY = 'selectedLanguage';
const FALLBACK: LangCode = 'it';
const ALLOWED: LangCode[] = ['en', 'it', 'mk'];
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private _lang$ = new BehaviorSubject<LangCode>(this.readInitial());
  readonly language$ = this._lang$.asObservable();

  constructor(private i18n: TranslateService, @Inject(DOCUMENT) private doc: Document) {
    this.i18n.setDefaultLang(FALLBACK);
    this.apply(this._lang$.value);
  }

  set(lang: LangCode) {
    if (!lang || lang === this._lang$.value) return;
    localStorage.setItem(STORAGE_KEY, lang);
    this._lang$.next(lang);
    this.apply(lang);
  }

  current(): LangCode {
    return this._lang$.value;
  }

  private readInitial(): LangCode {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (ALLOWED as string[]).includes(raw)) return raw as LangCode;
    return FALLBACK;
  }

  private apply(lang: LangCode) {
    this.i18n.use(lang);
    this.doc.documentElement.lang = lang;
  }
}
