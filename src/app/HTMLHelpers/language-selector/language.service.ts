import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private languageSubject = new BehaviorSubject<string>(sessionStorage.getItem('selectedLanguage') || 'en');
  public language$ = this.languageSubject.asObservable(); // Observable to track language changes

  constructor(private translate: TranslateService) {
    this.translate.use(this.languageSubject.value);     // Set initial language
  }

  changeLanguage(lang: string): void {
    sessionStorage.setItem('selectedLanguage', lang);   // Save language
    this.languageSubject.next(lang);                    // Update BehaviorSubject
    this.translate.use(lang);                           // Apply new language
  }
}
