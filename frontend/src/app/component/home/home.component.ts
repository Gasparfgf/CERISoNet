import { Component } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";
import {NotificationService} from "../service/notification.service";
import {AuthService} from "../service/auth.service";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  lastLogin: string | null = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  logout() {
    this.authService.logout().subscribe(() => {
      this.notificationService.showNotification('Vous êtes déconnecté.', 'success');
      this.router.navigate(['/login']);
    }, (error) => {
      console.error('Erreur lors de la déconnexion', error);
      this.notificationService.showNotification('Erreur lors de la déconnexion.', 'error');
    });
  }

}
