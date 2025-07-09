import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-header-in',
  templateUrl: './header-in.component.html',
  styleUrls: ['./header-in.component.scss'],
  standalone: true,
    imports: [
    CommonModule, 
    TranslateModule
  ],
})
export class HeaderInComponent implements OnInit {
  pageTitle = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {

    this.updateTitleFromRoute();

    this.router.events.pipe(
      // Гледаме само на крајот од навигацијата
      filter(evt => evt instanceof NavigationEnd),
      // За да извлечеме најдлабоко вложената рута
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      // Земаме го data објектот од тој ActivatedRoute
      mergeMap(route => route.data)
    ).subscribe(data => {
      this.pageTitle = data['title'] || '';
    });
  }

  private updateTitleFromRoute(): void {
    // најди ја најдлабоко вложената child-рута
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    // подеси го pageTitle од data.title (или празно ако нема)
    this.pageTitle = route.snapshot.data['title'] || '';
  }
}
