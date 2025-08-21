import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    TranslateModule
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  private obsSubs: IntersectionObserver[] = [];
  private routerSub!: Subscription;

  public currentYear = new Date().getFullYear();
  public sections = ['home', 'about', 'people', 'packages', 'contact', 'info'];

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

  constructor(private translate: TranslateService, private router: Router) {
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

    document.querySelectorAll('.section_scroll').forEach((el) => {
      observer.observe(el);
    });
  }

  ngAfterViewInit(){
    const sections = document.querySelectorAll('.section_scroll');
    sections.forEach((section) => {
      section.classList.add('section-visible');
    });
  }

  ngOnDestroy(): void {
    // Cleanup observers and subscription
    this.obsSubs.forEach(o => o.disconnect());
    this.routerSub.unsubscribe();
  }

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
    document.querySelectorAll<HTMLElement>('.animate-on-scroll').forEach(el => animateObserver.observe(el));
    this.obsSubs.push(animateObserver);

    // Active section observer
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach(link => {
          link.classList.toggle('active', link.getAttribute('href')?.substring(1) === id);
        });
      });
    }, { root, threshold: 0.5 });
    document.querySelectorAll<HTMLElement>('.section-scroll').forEach(sec => sectionObserver.observe(sec));
    this.obsSubs.push(sectionObserver);
  }

  public scrollToSection(id: string, ev: Event): void {
    ev.preventDefault();                                          // Prevent default anchor click behavior

    const root = document.getElementById('content-wrap');         // Get the root element for scrolling
    const sec = document.getElementById(id);                      // Get the target section element by ID
    
    if (!root || !sec) return;                                    // If root or section is not found, exit

    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });   // Scroll to the section smoothly
  }

  private restoreScrollPosition(): void {
    const root = document.getElementById('content-wrap');
    if (root) {
      root.scrollTo({ top: 0 });
    }
  }

  public onLoginClick(): void {
    this.router.navigate(['/login'], { queryParams: { tab: 'login' } });
  }

  public logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }
}
