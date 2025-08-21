// src/app/shared/app-title.service.ts
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AppTitleService {
  private suffix = 'DBStore';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private title: Title,
    private i18n: TranslateService
  ) {}

  init() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      const dataTitle = this.deepestTitle(this.route);
      const translated = dataTitle ? this.i18n.instant(dataTitle) : 'Home';
      this.title.setTitle(`${translated} — ${this.suffix}`);
    });
  }

  private deepestTitle(route: ActivatedRoute): string | null {
    let r: ActivatedRoute | null = route.firstChild;
    let last: ActivatedRoute = route;
    while (r) { last = r; r = r.firstChild; }
    return (last.snapshot.data?.['title'] as string) || null;
  }
}
