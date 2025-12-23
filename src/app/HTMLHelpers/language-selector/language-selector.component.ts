import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService, LangCode } from './language.service';
import { ElementRef } from '@angular/core';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent {
  dropdownOpen = false;

  languages: ReadonlyArray<{ code: LangCode; name: string }> = [
    { code: 'en', name: 'EN' },
    { code: 'it', name: 'IT' },
    { code: 'mk', name: 'MK' }
  ];

  constructor(private langSvc: LanguageService, private el: ElementRef<HTMLElement>) {}

  /** секогаш ја читаме моменталната вредност од сервисот */
  get selectedLanguage(): LangCode {
    return this.langSvc.current();
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  changeLanguage(lang: LangCode) {
    this.langSvc.set(lang);
    this.dropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.dropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.dropdownOpen = false;
  }

}
