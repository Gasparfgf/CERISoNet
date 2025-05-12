import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.backendUrl, { 
      withCredentials: true,
      transports: ['websocket'],
    });
  }

  // Événements d'écoute
  onUserConnected(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('user-connected', (data) => {
        console.log('WebSocket - Received user-connected:', data);
        observer.next(data)
    });
    });
  }

  onUserDisconnected(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('user-disconnected', (data) => {
        console.log('WebSocket - Received user-disconnected:', data);
        observer.next(data)
    });
    });
  }

  onMessageCommented(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('message-commented', (data) => {
        console.log('WebSocket - Received message-commented:', data);
        observer.next(data)
    });
    });
  }
  
  onMessageLiked(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('message-liked', (data) => {
        console.log('WebSocket - Received message-liked:', data);
        observer.next(data)
    });
    });
  }

  onMessageShared(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('message-shared', (data) => {
        console.log('WebSocket - Received message-shared:', data);
        observer.next(data)
    });
    });
  }

  emitEvent(eventName: string, data: any): void {
    this.socket.emit(eventName, data);
  }

}
