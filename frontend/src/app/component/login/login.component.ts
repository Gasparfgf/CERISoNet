import { Component } from '@angular/core';
import {HttpClientModule} from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { NotificationService } from "../../service/notification.service";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    HttpClientModule,
    NgClass
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
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  login() {
    this.authService.login(this.loginData, this.options).subscribe(
        (response: any) => {
          console.log('Login successful', response);
          this.successMessage = "✅ " + response.message;
          this.errorMessage = '';

          const previousLogin = this.authService.getLastLogin();
          this.lastLogin = previousLogin == '' ? this.formatDate(previousLogin) : 'Aucune connexion précédente';
          this.authService.saveLastLogin(response.lastLogin);

          this.notificationService.showNotification(
            this.successMessage + " | Dernière connexion : " + this.lastLogin,'success'
          );

          this.router.navigate(['/home']);
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
    return date.toLocaleString();
  }
}
