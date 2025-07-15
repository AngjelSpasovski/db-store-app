import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PdfViewerModule }   from 'ng2-pdf-viewer';

@Component({
  selector: 'app-service-delivery-policy',
  templateUrl: './service-delivery-policy.component.html',
  styleUrls: ['./service-delivery-policy.component.scss'],
  standalone: true,
  imports: [
    CommonModule,         // Importing CommonModule for basic Angular features
    TranslateModule,      // Importing translation module
    PdfViewerModule       // Importing PDF viewer module
  ]
})
export class ServiceDeliveryPolicyComponent  implements OnInit {

  public culture: string = 'EN'; // Default culture
  public pdfSrc = `../../../../assets/privacy/service-delivery/service-delivery-policy-${this.culture}.pdf`; // Path to the PDF file

  constructor() { }

  ngOnInit() {}

}
