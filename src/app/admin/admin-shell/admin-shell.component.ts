import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss']
})
export class AdminShellComponent {}

