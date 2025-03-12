import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `https://pedago.univ-avignon.fr:3215`;

  constructor(private http: HttpClient) { }

  login(body: any, options: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, body, options);
  }

  saveLastLogin(date: string) {
    localStorage.setItem('lastLogin', date);
  }

  getLastLogin(): string | null {
    return localStorage.getItem('lastLogin');
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {});
  }
}
