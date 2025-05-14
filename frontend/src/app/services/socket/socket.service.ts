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
  emitEvent(eventName: string, data: any): void {
    this.socket.emit(eventName, data);
  }

  emitUserConnection(userData: { userId: number, pseudo: string, avatar: string }): void {
    this.socket.emit('user-connected', userData);
  }

  onCommentDeleted(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('comment-deleted', (data) => observer.next(data));
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

  onUpdatedConnectedUsers(): Observable<any[]> {
    return new Observable(observer => {
      this.socket.on('updated-connected-users', (data) => observer.next(data));
    });
  }
  
  onUserConnected(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('user-connected', (data) => {
        observer.next(data)
    });
    });
  }

  onUserDisconnected(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('user-disconnected', (data) => {
        observer.next(data)
      });
    });
  }

}
