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
  
  public culture: string = 'EN'; // Default culture
  public pdfSrc = `../../../../assets/privacy/privacy-policy/privacy-policy-${this.culture}.pdf`; // Path to the PDF file

  constructor() { }

  ngOnInit() {}

}
