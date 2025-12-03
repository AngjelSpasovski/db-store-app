// src/app/user/document-viewer/document-viewer.component.ts
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PdfViewerModule, PDFProgressData } from 'ng2-pdf-viewer';

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

  // zoom
  zoom = 1;
  private readonly zoomStep = 0.2;
  private readonly minZoom = 0.6;
  private readonly maxZoom = 2.0;

  // loading / error / fullscreen state
  isLoading = true;
  isError = false;
  loadProgress = 0;   // 0–100
  isFullscreen = false;

  @ViewChild('pdfShell', { static: false }) pdfShell?: ElementRef<HTMLDivElement>;

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

    this.translate.onLangChange.subscribe(() => this.updatePdfSrc());
  }

  private updatePdfSrc(): void {
    const lang = (this.translate.currentLang || 'en').toUpperCase();

    const culture =
      lang.startsWith('MK') ? 'MK' :
      lang.startsWith('IT') ? 'IT' :
      'EN';

    this.pdfSrc = this.buildPdfPath(this.docType, culture);

    // секогаш кога менуваме документ, ресетирај state
    this.isLoading = true;
    this.isError = false;
    this.loadProgress = 0;
    this.zoom = 1;
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

  // ───── Zoom controls ─────
  zoomIn(): void {
    this.zoom = Math.min(this.zoom + this.zoomStep, this.maxZoom);
  }

  zoomOut(): void {
    this.zoom = Math.max(this.zoom - this.zoomStep, this.minZoom);
  }

  resetZoom(): void {
    this.zoom = 1;
  }

  // ───── PDF events ─────
  onPdfLoadComplete(): void {
    this.isLoading = false;
    this.isError = false;
    this.loadProgress = 100;
  }

  onPdfError(error: any): void {
    console.error('PDF error', error);
    this.isLoading = false;
    this.isError = true;
  }

  onPdfProgress(progress: PDFProgressData): void {
    if (progress.total) {
      this.loadProgress = Math.round((progress.loaded / progress.total) * 100);
    } else {
      // ако нема total, нека оди до максимум 90%
      this.loadProgress = Math.min(90, this.loadProgress + 5);
    }
  }

  // ───── Fullscreen (CSS-based) ─────
  //toggleFullscreen(): void {
  //  this.isFullscreen = !this.isFullscreen;
  //}
}
