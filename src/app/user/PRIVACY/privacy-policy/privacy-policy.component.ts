import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PdfViewerModule }   from 'ng2-pdf-viewer';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
  standalone: true,
  imports: [
    CommonModule,         // Importing CommonModule for basic Angular features
    TranslateModule,      // Importing translation module
    PdfViewerModule       // Importing PDF viewer module
  ]
})
export class PrivacyPolicyComponent  implements OnInit {

  public culture: string = 'IT'; // Default culture
  public pdfSrc = `../../../../assets/privacy/privacy-policy/privacy-policy-${this.culture}.pdf`; // Path to the PDF file

  zoom = 1;
  private readonly zoomStep = 0.2;
  private readonly minZoom = 0.6;
  private readonly maxZoom = 2.0;

  constructor() { }

  ngOnInit() {}

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
