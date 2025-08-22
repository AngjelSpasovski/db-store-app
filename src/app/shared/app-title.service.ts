// src/app/shared/app-title.service.ts
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AppTitleService {
  private appName = 'DBStore';
  private sep = ' · ';
  private initialized = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private title: Title,
    private i18n: TranslateService,
  ) {}

  /** да се повика еднаш (веќе го викаш од AppComponent) */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // на секоја навигација – пресметај
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.refresh()
    });

    // на промена на јазик – рефреширај
    this.i18n.onLangChange.subscribe(() => this.refresh());

    // иницијално
    this.refresh();
  }

  /** рачно рефреширање (ако треба) */
  refresh(): void {
    const deepest = this.getDeepest(this.route.snapshot);
    const key = deepest.data?.['title'] as string | undefined;

    const translated = key ? this.i18n.instant(key) : this.fallbackFromUrl(deepest);
    this.setTitle(translated);
  }

  /** привремен наслов (ако сакаш да промениш ад-hoc) */
  setTransient(titleText: string) {
    this.title.setTitle(`${titleText}${this.sep}${this.appName}`);
  }

  private setTitle(main: string) {
  const safe = (main || '').trim();
  const isKey = /^[A-Z0-9_.-]+$/.test(safe);        // ако личи на i18n key
  const show  = isKey ? this.i18n.instant(safe) : safe;
  const finalTitle = show ? `${show}${this.sep}${this.appName}` : this.appName;
  this.title.setTitle(finalTitle);
}


  private getDeepest(s: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let cur = s;
    while (cur.firstChild) cur = cur.firstChild;
    return cur;
  }

  private fallbackFromUrl(s: ActivatedRouteSnapshot): string {
    const segs = s.url?.map(u => u.path).filter(Boolean) ?? [];
    if (!segs.length) return this.i18n.instant('HOME') || 'Home';
    const guess = segs[segs.length - 1].replace(/-/g, ' ');
    // Пробај превод, ако нема – Title Case
    const maybe = this.i18n.instant(guess.toUpperCase());
    return maybe !== guess.toUpperCase()
      ? maybe
      : guess.charAt(0).toUpperCase() + guess.slice(1);
  }
}
