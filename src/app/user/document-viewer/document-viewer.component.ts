// src/app/user/PRIVACY/document-viewer/document-viewer.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';

type PolicyDocType =
  | 'privacy-policy'
  | 'terms'
  | 'cookies'
  | 'refund-policy'
  | 'service-delivery-policy';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule, TranslateModule],
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss']
})

export class DocumentViewerComponent implements OnInit {

  docType!: PolicyDocType;
  titleKey!: string;

  pdfSrc = '';

  zoom = 1;
  private readonly zoomStep = 0.2;
  private readonly minZoom = 0.6;
  private readonly maxZoom = 2.0;

  constructor(
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data as {
      docType: PolicyDocType;
      title: string;
    };

    this.docType = data.docType;
    this.titleKey = data.title;

    this.updatePdfSrc();

    // ако менуваш јазик runtime и сакаш да се смени PDF-то:
    this.translate.onLangChange.subscribe(() => this.updatePdfSrc());
  }

  private updatePdfSrc(): void {
    const lang = (this.translate.currentLang || 'en').toUpperCase();

    // мапирање на i18n lang → наши суфикси EN / IT / MK
    const culture =
      lang.startsWith('MK') ? 'MK' :
      lang.startsWith('IT') ? 'IT' :
      'EN';

    this.pdfSrc = this.buildPdfPath(this.docType, culture);

    //console.log(this.pdfSrc);
  }

  private buildPdfPath(docType: PolicyDocType, culture: string): string {
    switch (docType) {
      case 'privacy-policy':
        return `../../../../assets/privacy/privacy-policy/privacy-policy-${culture}.pdf`;

      case 'terms':
        return `../../../../assets/privacy/terms/terms-${culture}.pdf`;

      case 'cookies':
        return `../../../../assets/privacy/cookies/cookies-${culture}.pdf`;

      case 'refund-policy':
        return `../../../../assets/privacy/refund-policy/refund-policy-${culture}.pdf`;

      case 'service-delivery-policy':
        return `../../../../assets/privacy/service-delivery/service-delivery-policy-${culture}.pdf`;
    }
  }

  // zoom controls
  zoomIn(): void {
    this.zoom = Math.min(this.zoom + this.zoomStep, this.maxZoom);
  }

  zoomOut(): void {
    this.zoom = Math.max(this.zoom - this.zoomStep, this.minZoom);
  }

  resetZoom(): void {
    this.zoom = 1;
  }
}

