// src/app/home/home.page.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { IonicModule, IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription, timer } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { FormsModule, NgForm } from '@angular/forms';
import { EmailJsService } from '../auth/mail-server/emailjs.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  private obsSubs: IntersectionObserver[] = [];
  private routerSub!: Subscription;

  private flashSub?: Subscription;

  private scrollRoot: HTMLElement | null = null;
  private headerRO?: ResizeObserver;
  private rebuildTO?: any;

  public currentYear = new Date().getFullYear();
  public sections = ['home', 'about', 'how-it-works', 'packages', 'statistics', 'showcase', 'people', 'contact', 'info'];

  public infoData = {
    company: 'OUR_COMPANY_NAME',
    street: 'ADDRESS_NAME',
    city: 'CITY_NAME',
    state: 'STATE_NAME',
    zip: '1000',
    phone: '+389 71 311 127',
    email: 'contact@dbstore.online',
    email2: 'info@dbstore.online',
    vat: '4082017520050',
  };

  public sending = false;
  public sendOk = false;
  public sendErr = false;

  public subscribeEmail = '';

  constructor(
    private translate: TranslateService,
    private router: Router,
    private emailJs: EmailJsService,
    private toast: ToastService
  ) {
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd && (e as NavigationEnd).urlAfterRedirects === '/home')
    ).subscribe(() => {
      this.restoreScrollPosition();
      this.scheduleRebuildObservers();
    });
  }

  ngOnInit(): void {}

  async ngAfterViewInit(): Promise<void> {
    // 1) resolve scroll root once
    this.scrollRoot = await this.resolveScrollRoot();

    // 2) set & observe header height (CSS var)
    this.setHeaderOffsetVar();
    this.observeHeaderHeight();

    // 3) build observers
    this.setupObservers();
  }

  ngOnDestroy(): void {
    this.obsSubs.forEach(o => o.disconnect());
    this.routerSub?.unsubscribe();
    this.flashSub?.unsubscribe();

    this.headerRO?.disconnect();
    if (this.rebuildTO) clearTimeout(this.rebuildTO);
  }

  /* ========================================================================
    CONTACT
  ======================================================================== */

  public onContactSubmit(form: HTMLFormElement): void {
    if (this.sending) return;

    this.sendOk = false;
    this.sendErr = false;

    if (!this.isAllowedOrigin()) {
      this.sendErr = true;
      this.toast.info(this.translate.instant('MESSAGE_SENT_ERR'), { position: 'top-end' });
      this.flashError(5000);
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const hp = (form.querySelector('[name="website"]') as HTMLInputElement | null)?.value?.trim();
    if (hp) return; // silent block

    if (!this.canSendNow()) {
      this.sendErr = true;
      this.toast.warn(this.translate.instant('PLEASE_WAIT_BEFORE_SENDING'), { position: 'top-end' });
      this.flashError(5000);
      return;
    }

    this.sending = true;

    this.emailJs.sendContactForm(form)
      .pipe(finalize(() => (this.sending = false)))
      .subscribe({
        next: () => {
          this.sendOk = true;
          this.toast.success(this.translate.instant('MESSAGE_SENT_OK'), { position: 'top-end' });
          form.reset();
          this.flashSuccess(5000);
        },
        error: (err) => {
          console.error('EmailJS send error:', err);
          this.sendErr = true;
          this.toast.error(this.translate.instant('MESSAGE_SENT_ERR'), { position: 'top-end' });
          this.flashError(5000);
        }
      });
  }

  private canSendNow(): boolean {
    const key = 'contact_last_sent_at';
    const last = Number(localStorage.getItem(key) || '0');
    const now = Date.now();
    if (now - last < 30_000) return false;
    localStorage.setItem(key, String(now));
    return true;
  }

   /* ========================================================================
    SUBSCRIBE
  ======================================================================== */
  public onSubscribe(form: NgForm): void {
  // минимална валидација (за да не прикажуваме success за празно/невалидно)
  if (!form.valid) {
    this.toast.warn(this.translate.instant('PLEASE_ENTER_EMAIL') || 'Please enter a valid email.', { position: 'top-end' });
    return;
  }

  // ✅ Лажно „успешно“ праќање
  const msg = this.translate.instant('SUBSCRIBE_OK');
  this.toast.success(msg === 'SUBSCRIBE_OK' ? 'Subscribed successfully!' : msg, { position: 'top-end' });

  // ✅ исчисти input + ресетирај форма (без network)
  this.subscribeEmail = '';
  form.resetForm();
}


  /* ========================================================================
    SCROLL ROOT + HEADER OFFSET
  ======================================================================== */

  private async resolveScrollRoot(): Promise<HTMLElement | null> {
    // 1) custom wrapper
    const wrap = document.getElementById('content-wrap');
    if (wrap) return wrap;

    // 2) ionic inner scroll (fallback)
    const ion = document.querySelector('ion-content') as any;
    const inner = ion?.shadowRoot?.querySelector('.inner-scroll') as HTMLElement | null;
    return inner ?? null;
  }

  private setHeaderOffsetVar(): void {
    const headerEl = document.querySelector('header.app-header') as HTMLElement | null;
    const h = headerEl?.offsetHeight ?? 0;
    // глобално, за да важи и за header + anchors
    document.documentElement.style.setProperty('--header-offset', `${h}px`);
  }

  private observeHeaderHeight(): void {
    const headerEl = document.querySelector('header.app-header') as HTMLElement | null;
    if (!headerEl || typeof ResizeObserver === 'undefined') return;

    this.headerRO?.disconnect();

    this.headerRO = new ResizeObserver(() => {
      this.setHeaderOffsetVar();
      // кога се отвора/затвора mobile collapse → header height се менува
      // IO rootMargin не може live-update → rebuild observers
      this.scheduleRebuildObservers();
    });

    this.headerRO.observe(headerEl);
  }

  private scheduleRebuildObservers(): void {
    if (this.rebuildTO) clearTimeout(this.rebuildTO);
    this.rebuildTO = setTimeout(() => this.setupObservers(), 60);
  }

  private getHeaderOffsetPx(): number {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-offset').trim();
    const n = Number(raw.replace('px', ''));
    return Number.isFinite(n) ? n : 0;
  }

  /* ========================================================================
    OBSERVERS (animations + active section + stats)
  ======================================================================== */

  private setupObservers(): void {
    this.obsSubs.forEach(o => o.disconnect());
    this.obsSubs = [];

    const root = this.scrollRoot;
    const headerH = this.getHeaderOffsetPx();

    // ако имаме root (inner scroll), тој веќе е “под header” → не одземаме headerH
    const topCut = root ? 8 : (headerH + 8);

    // 1) Animation observer
    const animateObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
    }, { root, threshold: 0.2 });

    document.querySelectorAll<HTMLElement>('.animate-on-scroll').forEach(el => animateObserver.observe(el));
    this.obsSubs.push(animateObserver);

    // 2) Active section observer (best candidate = highest ratio + closest to “line”)
    const sectionObserver = new IntersectionObserver((entries) => {
      const candidates = entries.filter(e => e.isIntersecting);
      if (!candidates.length) return;

      const rootTop = root ? root.getBoundingClientRect().top : 0;
      const line = rootTop + topCut + 12;

      const best = candidates.reduce((acc, cur) => {
        // primary: biggest visible ratio
        if (cur.intersectionRatio !== acc.intersectionRatio) {
          return cur.intersectionRatio > acc.intersectionRatio ? cur : acc;
        }
        // secondary: closest to our “header line”
        const accDist = Math.abs(acc.boundingClientRect.top - line);
        const curDist = Math.abs(cur.boundingClientRect.top - line);
        return curDist < accDist ? cur : acc;
      });

      const id = (best.target as HTMLElement).id;

      document.querySelectorAll<HTMLAnchorElement>('.app-header a.nav-link')
        .forEach(link => {
          const href = link.getAttribute('href') || '';
          const linkId = href.startsWith('#') ? href.slice(1) : href;
          link.classList.toggle('active', linkId === id);
        });

    }, {
      root,
      threshold: [0.25, 0.5, 0.75],
      // горе (header), долу (да не фати следна секција прерано)
      rootMargin: `-${topCut}px 0px -55% 0px`
    });

    document.querySelectorAll<HTMLElement>('.section-scroll').forEach(sec => sectionObserver.observe(sec));
    this.obsSubs.push(sectionObserver);

    // 3) Statistics count-up observer (one time per card)
    const statsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const card = entry.target as HTMLElement;
        card.querySelectorAll<HTMLElement>('.stat-number').forEach(el => {
          const target = Number(el.dataset['target'] || '0');
          this.animateNumber(el, target);
        });

        statsObserver.unobserve(card);
      });
    }, { root, threshold: 0.6 });

    document.querySelectorAll<HTMLElement>('#statistics .stat-card')
      .forEach(card => statsObserver.observe(card));

    this.obsSubs.push(statsObserver);
  }

  /* ========================================================================
    NAV SCROLL (used by home + footer links)
  ======================================================================== */

  scrollToSection(id: string, ev: Event) {
    ev.preventDefault();

    const sec = document.getElementById(id);
    if (!sec) return;

    const root = this.scrollRoot;
    const headerH = this.getHeaderOffsetPx();

    const offset = root ? 8 : (headerH + 8);

    if (root) {
      const rootTop = root.getBoundingClientRect().top;
      const secTop = sec.getBoundingClientRect().top;
      const top = (secTop - rootTop) + root.scrollTop - offset;
      root.scrollTo({ top, behavior: 'smooth' });
    } else {
      const top = sec.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  private restoreScrollPosition(): void {
    const root = this.scrollRoot;
    if (root) root.scrollTo({ top: 0 });
    else window.scrollTo({ top: 0 });
  }

  public onLoginClick(): void {
    this.router.navigateByUrl('/login');
  }

  public logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }

  private animateNumber(el: HTMLElement, target: number) {
    const duration = 1400;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = `${value}+`;

      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = `${target}+`;
    };

    requestAnimationFrame(step);
  }

  private readonly allowedHosts = new Set([
    'dbstore.online',
    'www.dbstore.online',
    'db-store-it.web.app',
    'localhost'
  ]);

  private isAllowedOrigin(): boolean {
    return this.allowedHosts.has(window.location.hostname);
  }

  private flashSuccess(ms = 5000) {
    this.flashSub?.unsubscribe();
    this.flashSub = timer(ms).subscribe(() => (this.sendOk = false));
  }

  private flashError(ms = 5000) {
    this.flashSub?.unsubscribe();
    this.flashSub = timer(ms).subscribe(() => (this.sendErr = false));
  }

  toTel(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  }
}
