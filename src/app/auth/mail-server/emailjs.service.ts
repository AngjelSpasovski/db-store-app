import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import { from, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

emailjs.init('7DIgrUFTWvWyol6Qr');  // твојот public key

@Injectable({ providedIn: 'root' })
export class EmailJsService {
  private serviceId  = 'service_9j8ez3k';
  private templateId = 'template_3v4i0vq';

  // Остави ја ако ти треба и варијанта со вистински HTMLFormElement
  sendWithAttachment(form: HTMLFormElement): Promise<EmailJSResponseStatus> {
    return emailjs.sendForm(this.serviceId, this.templateId, form);
  }

  // >>> НОВА имплементација: 2 аргументи + Observable
  sendSignupAttachment(file: File, meta: any): Observable<EmailJSResponseStatus> {
    // 1) динамички креираме <form>
    const form = document.createElement('form');

    // text fields
    const to = document.createElement('input');
    to.name = 'to_email';
    to.value = 'signup@your-domain.tld'; // TODO: промени на реална адреса
    form.appendChild(to);

    const msg = document.createElement('textarea');
    msg.name = 'message';
    msg.value = JSON.stringify(meta, null, 2);
    form.appendChild(msg);

    // file field (EmailJS очекува <input type="file" name="attachment">)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'attachment';

    // Поставување на File програмски преку DataTransfer
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    form.appendChild(fileInput);

    // мора да биде во DOM за sendForm
    form.style.display = 'none';
    document.body.appendChild(form);

    // 2) испраќање преку EmailJS како Observable
    return from(emailjs.sendForm(this.serviceId, this.templateId, form))
      .pipe(
        finalize(() => {
          // чистење DOM
          document.body.removeChild(form);
        })
      );
  }
}
