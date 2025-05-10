import { CommonModule, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.css'
})
export class BannerComponent {

  notification: { message: string, type: string } | null = null;

  constructor(private notificationService: NotificationService) {
    this.notificationService.currentMessage.subscribe(message => {
      this.notification = message;
    });
  }

  closeNotification() {
    this.notification = null;
  }
}
