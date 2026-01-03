//src/app/auth/mail-server/emailjs.service.ts
import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import { from, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class EmailJsService {
  private readonly serviceId  = 'service_9j8ez3k';
  private readonly templateId = 'template_3v4i0vq';

  private initialized = false;

  constructor() {
    this.initOnce();
  }

  // initialization only once, because emailjs.init()
  private initOnce(): void {
    if (this.initialized) return;
    emailjs.init('7DIgrUFTWvWyol6Qr');  // user/public key
    this.initialized = true;
  }

  sendContactForm(form: HTMLFormElement): Observable<EmailJSResponseStatus> {
    return from(emailjs.sendForm(this.serviceId, this.templateId, form));
  }

  // registration with attachment - old implementation with Promise
  sendWithAttachment(form: HTMLFormElement): Promise<EmailJSResponseStatus> {
    return emailjs.sendForm(this.serviceId, this.templateId, form);
  }

  // >>> НОВА имплементација: 2 аргументи + Observable
  sendSignupAttachment(file: File, meta: unknown): Observable<EmailJSResponseStatus> {
    const form = document.createElement('form');

    const to = document.createElement('input');
    to.name = 'to_email';
    to.value = 'signup@dbstore.online'; // ✅ смени на реална
    form.appendChild(to);

    const msg = document.createElement('textarea');
    msg.name = 'message';
    msg.value = JSON.stringify(meta, null, 2);
    form.appendChild(msg);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'attachment';

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    form.appendChild(fileInput);

    form.style.display = 'none';
    document.body.appendChild(form);

    return from(emailjs.sendForm(this.serviceId, this.templateId, form)).pipe(
      finalize(() => {
        if (form.parentNode) form.parentNode.removeChild(form);
      })
    );
  }

}
