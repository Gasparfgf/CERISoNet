import { HttpClient } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.backendUrl;

  constructor(private http: HttpClient) { }

  login(body: any, options: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, body, options);
  }

  saveLastLogin(date: string) {
    localStorage.setItem('lastLogin', date);
  }

  saveUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  getUser(): any {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : '{}';
    } catch (e) {
      console.error('Erreur de parsing du user depuis localStorage', e);
      return null;
    }
    //return JSON.parse(localStorage.getItem('user') || );
  }

  getConnectedUsers(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/users/connected`, { withCredentials: true });
  }
  
  getLastLogin(): string | null {
    return localStorage.getItem('lastLogin');
  }

  logout(): Observable<any> {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastLogin');
    
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }
}
