import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LoginComponent} from "./component/login/login.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {NotificationService} from "./service/notification.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, FormsModule, NgIf, ReactiveFormsModule, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
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
