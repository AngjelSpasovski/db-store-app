//src/app/auth/mail-server/emailjs.service.ts
import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import { from, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class EmailJsService {
  private readonly serviceId          = 'service_9j8ez3k';
  private readonly contactTemplateId  = 'template_3v4i0vq';
  private readonly signupTemplateId   = 'template_1pnq6v8';

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
    return from(emailjs.sendForm(this.serviceId, this.contactTemplateId, form));
  }

  // registration with attachment - old implementation with Promise
  sendWithAttachment(form: HTMLFormElement): Observable<EmailJSResponseStatus> {
    return from(emailjs.sendForm(this.serviceId, this.signupTemplateId, form));
  }


  sendSignupAttachment(file: File, meta: any): Observable<EmailJSResponseStatus> {
    const form = document.createElement('form');

    const add = (name: string, value: any) => {
      const input = document.createElement('input');
      input.name = name;
      input.value = value == null ? '' : String(value);
      form.appendChild(input);
    };

    // 👉 variables што ги користи твојот template
    add('companyName',  meta.companyName);
    add('name',         meta.name);
    add('surname',      meta.surname);
    add('email',        meta.email);
    add('phoneNumber',  meta.phoneNumber);
    add('city',         meta.city);
    add('state',        meta.state);
    add('zip',          meta.zip);
    add('vat',          meta.vat);
    add('role',         meta.role);

    // ако сакаш да оди на специфичен recipient преку template:
    add('to_email', 'angjel.spasovski@gmail.com');

    // file field (мора да се совпадне со EmailJS Attachments конфигурацијата)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'attachment'; // или 'my_file' — како ќе го наместиш во EmailJS
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    form.appendChild(fileInput);

    form.style.display = 'none';
    document.body.appendChild(form);

    return from(emailjs.sendForm(this.serviceId, this.signupTemplateId, form)).pipe(
      finalize(() => form.remove())
    );
  }

  sendSignupMetaOnly(meta: any): Observable<EmailJSResponseStatus> {
    const params: Record<string, string> = {
      companyName:  meta.companyName ?? '',
      name:         meta.name ?? '',
      surname:      meta.surname ?? '',
      email:        meta.email ?? '',
      phoneNumber:  meta.phoneNumber ?? '',
      city:         meta.city ?? '',
      state:        meta.state ?? '',
      zip:          meta.zip ?? '',
      vat:          meta.vat ?? '',
      role:         meta.role ?? '',
      to_email:     meta.to_email ?? 'angjel.spasovski@gmail.com',
    };

    // Ова не е sendForm, туку send со params (без attachment)
    return from(emailjs.send(this.serviceId, this.signupTemplateId, params));
  }

}
