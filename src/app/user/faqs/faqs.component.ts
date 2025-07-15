// faqs.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { TranslateModule, TranslateService, LangChangeEvent } from '@ngx-translate/core';

interface Faq {
  question: string;  // the translation key
  answer:   string;  // the translation key
}

interface FaqDisplay {
  original: Faq;
  qText:    string;  // translated question
  aText:    string;  // translated answer
}

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.scss']
})
export class FaqsComponent implements OnInit {
  filterText = '';

  // your static list of keys
  public faqs: Faq[] = [
    { question: 'FAQS_QUESTION_1', answer: 'FAQS_ANSWER_1' },
    { question: 'FAQS_QUESTION_2', answer: 'FAQS_ANSWER_2' },
    { question: 'FAQS_QUESTION_3', answer: 'FAQS_ANSWER_3' },
    { question: 'FAQS_QUESTION_4', answer: 'FAQS_ANSWER_4' },
    { question: 'FAQS_QUESTION_5', answer: 'FAQS_ANSWER_5' },
    { question: 'FAQS_QUESTION_6', answer: 'FAQS_ANSWER_6' },
    { question: 'FAQS_QUESTION_7', answer: 'FAQS_ANSWER_7' },
    { question: 'FAQS_QUESTION_8', answer: 'FAQS_ANSWER_8' },
    { question: 'FAQS_QUESTION_9', answer: 'FAQS_ANSWER_9' },
  ];

  // dynamic list with translated text
  faqDisplays: FaqDisplay[] = [];

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    // initial populate
    this.updateTranslations();

    // re-populate whenever language changes
    this.translate.onLangChange
      .subscribe((event: LangChangeEvent) => this.updateTranslations());
  }

  private updateTranslations() {
    this.faqDisplays = this.faqs.map(f => ({
      original: f,
      qText:    this.translate.instant(f.question),
      aText:    this.translate.instant(f.answer)
    }));
  }

  /** Filter against translated text */
  get filteredFaqs(): FaqDisplay[] {
    const term = this.filterText.trim().toLowerCase();
    if (!term) {
      return this.faqDisplays;
    }
    return this.faqDisplays.filter(fd =>
      fd.qText.toLowerCase().includes(term) ||
      fd.aText.toLowerCase().includes(term)
    );
  }

  trackByIndex(_: number) {
    return _;
  }
}
