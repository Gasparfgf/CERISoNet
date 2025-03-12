import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private messageSource = new BehaviorSubject<{ message: string, type: string } | null>(null);
  currentMessage = this.messageSource.asObservable();

  // Met à jour l'état du message
  showNotification(message: string, type: 'success' | 'error') {
    this.messageSource.next({ message, type });

    // cacher automatiquement après 5 seconds
    setTimeout(() => {
      this.clearNotification();
    }, 60000);
  }

  clearNotification() {
    this.messageSource.next(null);
  }

  constructor() { }
}
