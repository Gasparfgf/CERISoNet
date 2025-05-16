import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StudyGroup } from '../../models/study-group';
import { NotificationService } from '../notification/notification.service';

@Injectable({
  providedIn: 'root'
})
export class StudyGroupService {
  private apiUrl = `${environment.quarkusUrl}/api/study-groups`;

  // Définition des en-têtes HTTP pour les requêtes CORS
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }),
    withCredentials: false  // Important: définir à false pour les domaines croisés avec '*'
  };

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) { }

  // Gestionnaire d'erreur générique
  private handleError(error: any) {
    console.error('Une erreur s\'est produite', error);
    
    // Si l'erreur est liée à un certificat SSL auto-signé ou CORS
    if (error.status === 0) {
      this.notificationService.showNotification(
        'Erreur de connexion au serveur. Veuillez vérifier que vous avez accepté le certificat SSL.',
        'error'
      );
      
      // Suggestion pour aider l'utilisateur
      console.info('⚠️ Vous utilisez peut-être un certificat auto-signé. Ouvrez une nouvelle fenêtre et accédez directement à ' + 
                   environment.quarkusUrl + ' pour accepter le certificat SSL.');
    }
    
    return throwError(() => error);
  }

  getStudyGroups(): Observable<StudyGroup[]> {
    return this.http.get<StudyGroup[]>(this.apiUrl, this.httpOptions)
      .pipe(
        retry(1),
        catchError(error => this.handleError(error))
      );
  }

  getStudyGroupById(id: number): Observable<StudyGroup> {
    return this.http.get<StudyGroup>(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(
        retry(1),
        catchError(error => this.handleError(error))
      );
  }

  getStudyGroupsByTag(tag: string): Observable<StudyGroup[]> {
    return this.http.get<StudyGroup[]>(`${this.apiUrl}/tag/${tag}`, this.httpOptions)
      .pipe(
        retry(1),
        catchError(error => this.handleError(error))
      );
  }

  getStudyGroupsBySubject(subject: string): Observable<StudyGroup[]> {
    return this.http.get<StudyGroup[]>(`${this.apiUrl}/subject/${subject}`, this.httpOptions)
      .pipe(
        retry(1),
        catchError(error => this.handleError(error))
      );
  }

  createStudyGroup(group: StudyGroup): Observable<StudyGroup> {
    return this.http.post<StudyGroup>(this.apiUrl, group, this.httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  updateStudyGroup(id: number, group: StudyGroup): Observable<StudyGroup> {
    return this.http.put<StudyGroup>(`${this.apiUrl}/${id}`, group, this.httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  deleteStudyGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  joinGroup(groupId: number, userId: number): Observable<StudyGroup> {
    return this.http.post<StudyGroup>(`${this.apiUrl}/${groupId}/join/${userId}`, {}, this.httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  leaveGroup(groupId: number, userId: number): Observable<StudyGroup> {
    return this.http.delete<StudyGroup>(`${this.apiUrl}/${groupId}/leave/${userId}`, this.httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  analyzeKeywords(groupId: number): Observable<{keywords: string[]}> {
    return this.http.get<{keywords: string[]}>(`${this.apiUrl}/${groupId}/analyze-keywords`, this.httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }
}