import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';


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
export class HeaderInComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
