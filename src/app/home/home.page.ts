// src/app/home/home.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription, timer } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { EmailJsService } from '../auth/mail-server/emailjs.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    FormsModule
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  private obsSubs: IntersectionObserver[] = [];
  private routerSub!: Subscription;

  public currentYear = new Date().getFullYear();
  public sections = ['home', 'about', 'how-it-works', 'packages', 'statistics', 'showcase', 'people', 'contact', 'info'];


  public infoData = {
    company:  'OUR_COMPANY_NAME',
    street:   'ADDRESS_NAME',
    city:     'CITY_NAME',
    state:    'STATE_NAME',
    zip:      '1000',
    phone:    '+389 71 311 127',
    email:    'contact@dbstore.online',
    email2:   'info@dbstore.online',
    vat:      '4082017520050',
  }

  public sending  = false;
  public sendOk   = false;
  public sendErr  = false;

  private flashSub?: Subscription;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private emailJs: EmailJsService
  ) {
    // Setup on navigation back to /home
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd && (e as NavigationEnd).urlAfterRedirects === '/home')
    ).subscribe(() => {
      this.restoreScrollPosition();
      this.setupObservers();
    });
  }

  ngOnInit(): void {
    // Initial observer setup
    this.setupObservers();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.section-scroll').forEach((el) => {
      observer.observe(el);
    });
  }

  ngAfterViewInit(){
    const sections = document.querySelectorAll('.section-scroll');
    sections.forEach((section) => {
      section.classList.add('section-visible');
    });
  }

  ngOnDestroy(): void {
    // Cleanup observers and subscription
    this.obsSubs.forEach(o => o.disconnect());
    this.routerSub.unsubscribe();
    this.flashSub?.unsubscribe();

  }

  // Contact form submission
  public onContactSubmit(form: HTMLFormElement): void {
    if (this.sending) return;

    // reset messages
    this.sendOk = false;
    this.sendErr = false;

    // allowlist host check
    if (!this.isAllowedOrigin()) {
      this.sendErr = true;
      this.flashError(5000);
      return;
    }

    // basic HTML validity check
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // honeypot check - should be empty for real users
    const hp = (form.querySelector('[name="website"]') as HTMLInputElement | null)?.value?.trim();
    if (hp) return; // silent block

    // cooldown
    if (!this.canSendNow()) {
      this.sendErr = true;
      this.flashError(5000);
      return;
    }

    this.sending = true;

    this.emailJs
      .sendContactForm(form)
      .pipe(finalize(() => (this.sending = false)))
      .subscribe({
        next: () => {
          this.sendOk = true;
          form.reset();
          this.flashSuccess(5000);
        },
        error: (err) => {
          console.error('EmailJS send error:', err);
          this.sendErr = true;
          this.flashError(5000);
        }
      });
  }

  // Cooldown check for sending
  private canSendNow(): boolean {
    const key = 'contact_last_sent_at';
    const last = Number(localStorage.getItem(key) || '0');
    const now = Date.now();
    if (now - last < 30_000) return false; // 30s cooldown
    localStorage.setItem(key, String(now));
    return true;
  }

  // Setup IntersectionObservers
  private setupObservers(): void {
    // Disconnect existing observers
    this.obsSubs.forEach(o => o.disconnect());
    this.obsSubs = [];

    const root = document.getElementById('content-wrap');

    // Animation observer
    const animateObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      });
    }, { root, threshold: 0.2 });

    // animate-on-scroll elements
    document.querySelectorAll<HTMLElement>('.animate-on-scroll').forEach(el => animateObserver.observe(el));
    this.obsSubs.push(animateObserver);

    const headerEl = document.querySelector('header.app-header') as HTMLElement | null;
    const headerH = headerEl?.offsetHeight ?? 0;

    // Active section observer (choose BEST candidate, not "last entry")
    const sectionObserver = new IntersectionObserver((entries) => {
      const candidates = entries.filter(e => e.isIntersecting);
      if (!candidates.length) return;

      const line = headerH + 12; // “activation line” under header

      const best = candidates.reduce((acc, cur) => {
        const accDist = Math.abs(acc.boundingClientRect.top - line);
        const curDist = Math.abs(cur.boundingClientRect.top - line);
        return curDist < accDist ? cur : acc;
      });

      const id = (best.target as HTMLElement).id;

      // ✅ само header nav линкови (да не ти ги меша footer links)
      document
        .querySelectorAll<HTMLAnchorElement>('.app-header a.nav-link')
        .forEach(link => {
          const href = link.getAttribute('href') || '';
          const linkId = href.startsWith('#') ? href.slice(1) : href;
          link.classList.toggle('active', linkId === id);
        });

    }, {
      root: this.getScrollRoot(),
      threshold: [0.15, 0.25, 0.35],
      // ✅ исечи горе (header) и долу (за да не активира следна секција предвреме)
      rootMargin: `-${headerH + 8}px 0px -60% 0px`
    });

    document.querySelectorAll<HTMLElement>('.section-scroll').forEach(sec => sectionObserver.observe(sec));
    this.obsSubs.push(sectionObserver);


    // section-scroll elements
    document.querySelectorAll<HTMLElement>('.section-scroll').forEach(sec => sectionObserver.observe(sec));
    this.obsSubs.push(sectionObserver);

    // === Statistics count-up observer ===
    const statsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const card = entry.target as HTMLElement;
        const nums = card.querySelectorAll<HTMLElement>('.stat-number');

        nums.forEach(el => {
          const target = Number(el.dataset['target'] || '0');
          this.animateNumber(el, target);
        });

        // еднаш по card
        statsObserver.unobserve(card);
      });
    }, { root, threshold: 0.6 });

    document
      .querySelectorAll<HTMLElement>('#statistics .stat-card')
      .forEach(card => statsObserver.observe(card));

    this.obsSubs.push(statsObserver);
  }

  // Scroll handling
  private getScrollRoot(): HTMLElement | null {
    // 1) if using a custom scrollable div
    const wrap = document.getElementById('content-wrap');
    if (wrap) return wrap;

    // 2) Ionic: real scroller е во ion-content shadow (.inner-scroll)
    const ion = document.querySelector('ion-content') as any;
    const inner = ion?.shadowRoot?.querySelector('.inner-scroll') as HTMLElement | null;
    return inner ?? null;
  }

  // Scroll to section with header offset
  public scrollToSection(id: string, ev: Event): void {
    ev.preventDefault();

    const sec = document.getElementById(id);
    if (!sec) return;

    const headerEl = document.querySelector('header.app-header') as HTMLElement | null;
    const headerH = headerEl?.offsetHeight ?? 0;

    const root = this.getScrollRoot();

    if (root) {
      const rootTop = root.getBoundingClientRect().top;
      const secTop = sec.getBoundingClientRect().top;

      const top = (secTop - rootTop) + root.scrollTop - headerH - 8;
      root.scrollTo({ top, behavior: 'smooth' });
    } else {
      const top = sec.getBoundingClientRect().top + window.scrollY - headerH - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // Restore scroll position to top
  private restoreScrollPosition(): void {
    const root = document.getElementById('content-wrap');
    if (root) {
      root.scrollTo({ top: 0 });
    }
  }

  // Authentication navigation
  public onLoginClick(): void {
    this.router.navigateByUrl('/login');
  }

  // Logout
  public logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }

  // Number animation
  private animateNumber(el: HTMLElement, target: number) {
    const duration = 1400; // ms
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = `${value}+`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${target}+`;
      }
    };

    requestAnimationFrame(step);
  }

  private readonly allowedHosts = new Set([
    'dbstore.online',
    'www.dbstore.online',
    'db-store-it.web.app',
    'localhost'
  ]);

  // Check if current origin is allowed
  private isAllowedOrigin(): boolean {
    const host = window.location.hostname;
    return this.allowedHosts.has(host);
  }

  // Flash success message
  private flashSuccess(ms = 5000) {
    this.flashSub?.unsubscribe();
    this.flashSub = timer(ms).subscribe(() => (this.sendOk = false));
  }

  // Flash error message
  private flashError(ms = 5000) {
    this.flashSub?.unsubscribe();
    this.flashSub = timer(ms).subscribe(() => (this.sendErr = false));
  }

  toTel(phone: string): string {
    if (!phone) return '';
    // keep only + and digits (removes spaces, dashes, etc.)
    return phone.replace(/[^\d+]/g, '');
  }

}
