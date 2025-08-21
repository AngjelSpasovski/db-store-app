// language-selector.component.ts
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
  selectedLanguage = 'en';
  dropdownOpen = false;

  languages = [
    { code: 'en', name: 'EN' },
    { code: 'it', name: 'IT' },
    { code: 'mk', name: 'MK' }
  ];

  constructor(private lang: LanguageService) {
    this.selectedLanguage = this.lang.current; // централен извор на вистина
  }

  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  changeLanguage(code: string) {
    this.lang.set(code);           // ⬅️ овде е "setLang"
    this.selectedLanguage = code;
    this.dropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const t = event.target as HTMLElement;
    if (!t.closest('.custom-dropdown')) this.dropdownOpen = false;
  }
}
