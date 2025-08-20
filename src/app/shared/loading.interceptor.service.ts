import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpLoadingService } from './http-loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loader: HttpLoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // скокни статички ресурси за да не „блицка“
    const isStatic = /\/(assets|i18n)\//.test(req.url);
    if (isStatic) return next.handle(req);

    this.loader.inc();
    return next.handle(req).pipe(finalize(() => this.loader.dec()));
  }
}
