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
    const t = deepest.data?.['title'] as any;

    if (t && typeof t === 'object') {
      // поддржува { main?, prefix?, suffix? }
      this.setTitle(t.main, { prefix: t.prefix, suffix: t.suffix });
      return;
    }

    if (t != null) {
      const key = this.s(t);
      const translated = this.i18n.instant(key) || key;
      this.setTitle(translated);
      return;
    }

    const fallback = this.fallbackFromUrl(deepest);
    this.setTitle(fallback);
  }

  /** привремен наслов (ако сакаш да промениш ад-hoc) */
  /** Повикувај ја оваа ако сакаш да сетираш наслов ad-hoc */
  setTransient(titleText: string) {
    const main = this.s(titleText);
    this.title.setTitle(main ? `${main}${this.sep}${this.appName}` : this.appName);
  }

  private setTitle(main: unknown, extras?: { prefix?: unknown; suffix?: unknown }) {
    const final = this.join([extras?.prefix, main, extras?.suffix]) || this.appName;
    this.title.setTitle(final);
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


  private s(v: unknown): string {
    if (typeof v === 'string') return v.trim();
    if (v == null) return '';
    try { return String(v).trim(); } catch { return ''; }
  }
  private join(parts: unknown[], sep = this.sep): string {
    return parts.map(p => this.s(p)).filter(Boolean).join(sep);
  }

}
