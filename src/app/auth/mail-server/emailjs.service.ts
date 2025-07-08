// emailjs.service.ts
import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';

emailjs.init('7DIgrUFTWvWyol6Qr');  // ← use the one from the dashboard

@Injectable({ providedIn: 'root' })
export class EmailJsService {
  private serviceId  = 'service_9j8ez3k';    // <-- EXACT service ID here
  private templateId = 'template_3v4i0vq';   // <-- EXACT template ID here

  sendWithAttachment(form: HTMLFormElement): Promise<EmailJSResponseStatus> {
    return emailjs.sendForm(
      this.serviceId,
      this.templateId,
      form
      // no 4th arg needed if init() was called
    );
  }
}
