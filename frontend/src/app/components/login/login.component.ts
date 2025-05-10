import { NgClass, NgIf } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';
import { NotificationService } from "../../services/notification/notification.service";
import { SocketService } from "../../services/socket/socket.service";
import { BannerComponent } from "../banner/banner.component";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    HttpClientModule,
    NgClass,
    BannerComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  options = {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
  };
  loginData = { email: '', password: '' };
  errorMessage = '';
  successMessage = '';
  lastLogin: string | null = '';

  constructor(
    private router: Router,
    private wsService: SocketService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  login() {
    this.authService.login(this.loginData, this.options).subscribe(
        (response: any) => {
          if (response.success) {
            console.log('Login successful', response);
            this.successMessage = "✅ " + response.message;
            this.errorMessage = '';
            
            this.wsService.emitEvent('user-connected', {
              userId: response.user.id,
              pseudo: response.user.pseudo,
              avatar: response.user.avatar
            });
            this.authService.saveUser(response.user);
            this.authService.saveLastLogin(response.lastLogin);
            
            const previousLogin = response.lastLogin;
            this.lastLogin = previousLogin && previousLogin !== '' ? this.formatDate(previousLogin) : 'inconnue';
            
            this.notificationService.showNotification(
              this.successMessage + " | Dernière connexion : " + this.lastLogin,'success'
            );

            this.router.navigate(['/home']);
          }
        },
        (error: any) => {
          console.error('Login failed', error);
          this.errorMessage = "❌ " + error.error.message;
          this.successMessage = '';

          this.notificationService.showNotification(this.errorMessage, 'error');
        }
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }
}
