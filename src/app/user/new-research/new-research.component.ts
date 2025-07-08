import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-new-research',
  templateUrl: './new-research.component.html',
  styleUrls: ['./new-research.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule],
})
export class NewResearchComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
