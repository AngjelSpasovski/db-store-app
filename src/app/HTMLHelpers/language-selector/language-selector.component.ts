import { Component, HostListener  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule], // ✅ Import necessary modules
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent {

  public selectedLanguage: string;
  public dropdownOpen: boolean = false;

  public languages = [
    { code: 'en', name: 'EN' },
    { code: 'it', name: 'IT' },
    { code: 'mk', name: 'MK' }
  ];

  constructor(private translate: TranslateService) {
    this.selectedLanguage = sessionStorage.getItem('selectedLanguage') || 'en';
    this.translate.use(this.selectedLanguage);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  changeLanguage(lang: string): void {
    this.selectedLanguage = lang;
    this.translate.use(lang);
    sessionStorage.setItem('selectedLanguage', lang);
    this.dropdownOpen = false; // Close the dropdown after selection
  }

  /** Detect click outside the dropdown and close it */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.dropdownOpen = false;
    }
  }
}
