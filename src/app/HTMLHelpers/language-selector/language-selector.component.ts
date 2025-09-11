import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from './language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent {
  dropdownOpen = false;

  languages = [
    { code: 'en', name: 'EN' },
    { code: 'it', name: 'IT' },
    { code: 'mk', name: 'MK' }
  ];

  constructor(private langSvc: LanguageService) {}

  /** секогаш ја читаме моменталната вредност од сервисот */
  get selectedLanguage() { return this.langSvc.current(); }

  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  changeLanguage(lang: string) {
    this.langSvc.set(lang);      // ← перзистира + i18n.use + <html lang>
    this.dropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) this.dropdownOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.dropdownOpen = false; } 
  
}
