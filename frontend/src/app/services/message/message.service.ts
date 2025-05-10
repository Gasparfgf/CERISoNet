import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MessageComment } from '../../models/comment';
import { Message } from '../../models/message';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = `${environment.backendUrl}/api/messages`;

  constructor(private http: HttpClient) {}

  getMessages(params?: any): Observable<Message[]> {
    return this.http.get<Message[]>(this.apiUrl, { params });
  }

  likeMessage(id: string, payload: { userId: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/like`, payload);
  }

  shareMessage(id: string, payload: { userId: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/share`, payload);
  }

  addComment(id: string, comment: MessageComment): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/comments`, comment);
  }

  deleteComment(messageId: string, commentId: string, userId: number): Observable<any> {
    return this.http.request('DELETE', `${this.apiUrl}/${messageId}/comments/${commentId}`, {
      body: { userId }
    });
  }
  
}
