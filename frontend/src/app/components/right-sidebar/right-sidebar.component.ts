import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './right-sidebar.component.html',
  styleUrl: './right-sidebar.component.css'
})
export class RightSidebarComponent {
  selectedFilter = 'date';
  ownerFilter = 'all';
  hashtagFilter = '';

  applyFilter() {
    console.log('Filtre appliqué :', this.selectedFilter);
    // logiques de tri à brancher ici
  }

  filterMessages() {
    // filter logic
  }
}
