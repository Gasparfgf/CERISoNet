import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MessageComment } from '../../models/comment';
import { MessageResponse } from '../../models/message';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = `${environment.backendUrl}/api/messages`;

  constructor(private http: HttpClient) {}

  addComment(id: string, comment: MessageComment): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/comments`, comment);
  }

  deleteComment(messageId: string, commentId: string, userId: number): Observable<any> {
    return this.http.request('DELETE', `${this.apiUrl}/${messageId}/comments/${commentId}`, {
      body: { userId }
    });
  }

  getMessages(page: number = 1, limit: number = 10): Observable<MessageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<MessageResponse>(this.apiUrl, { params });
  }

  likeMessage(id: string, payload: { userId: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/like`, payload);
  }

  shareMessage(id: string, payload: { userId: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/share`, payload);
  }

}
