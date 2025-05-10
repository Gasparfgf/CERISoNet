import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.css'
})
export class LeftSidebarComponent {
  @Input() currentUser: any;
  @Input() lastLogin: string | null = '';
  @Input() connectedUsers: any[] = [];

}
