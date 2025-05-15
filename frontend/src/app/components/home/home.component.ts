import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { Router } from '@angular/router';
import { MessageComment } from '../../models/comment';
import { Message } from '../../models/message';
import { Notification } from '../../models/notification';
import { AuthService } from '../../services/authentication/auth.service';
import { MessageService } from '../../services/message/message.service';
import { NotificationService } from "../../services/notification/notification.service";
import { SocketService } from '../../services/socket/socket.service';
import { BannerComponent } from '../banner/banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule, CommonModule, BannerComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  messages: Message[] = [];
  isLoading = true;
  currentPage = 1;
  totalPages = 1;
  connectedUsers: any[] = [];
  currentUser: any;
  lastLogin: string | null = '';
  showComments: { [messageId: string]: boolean } = {};
  newComment: { [key: string]: string } = {};

  sortOption = 'date';
  ownerFilter = '';
  hashtagFilter = '';
  originalMessages: Message[] = [];
  filteredMessages: Message[] = [];

  notifications: Notification[] = [];
  showNotificationPanel = false;
  unreadCount: number = 0;

  isLoadingMore = false;
  enableInfiniteScroll = true;

  constructor(
    private notificationService: NotificationService,
    private messageService: MessageService,
    private authService: AuthService,
    private wsService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.lastLogin = this.authService.getLastLogin();

    this.fetchMessages();
    this.fetchConnectedUsers();
    this.listenToWebSocketEvents();

    this.filteredMessages = this.messages;
  }

  addNotification(message: string, type: string, entityId?: string, userId?: number): void {
    const notification: Notification = {
      id: this.generateUniqueId(),
      message,
      type,
      entityId,
      userId,
      timestamp: Date.now()
    };
    
    this.notifications.unshift(notification);
    this.unreadCount++;
  }

  deleteNotificationById(id: string): void {
    this.notifications = this.notifications.filter(note => note.id !== id);
  }

  clearAllNotifications(): void {
    this.notifications = [];
    this.unreadCount = 0;
  }

  deleteComment(message: Message, commentId: string): void {
    const userId = this.authService.getUser().id;
    console.log("Suppression commentaire - messageId:", message._id);
    console.log("Suppression commentaire - commentId:", commentId);
    console.log("Suppression commentaire - userId:", userId);
  
    this.messageService.deleteComment(message._id, commentId, userId).subscribe({
      next: (response) => {
        console.log('Réponse suppression:', response);
        if (response.success) {
          message.comments = message.comments.filter(c => c._id !== commentId);
          this.notificationService.showNotification("Commentaire supprimé", "success");
        }
      },
      error: (err) => {
        console.error('Erreur suppression commentaire:', err);
        this.notificationService.showNotification("Erreur lors de la suppression", "error");
      }
    });
  }
  
  fetchConnectedUsers(): void {
    this.authService.getConnectedUsers().subscribe({
      next: (data) => {
        this.connectedUsers = data;
      },
      error: (err) => {
        console.error('Erreur fetch connected users:', err);
        this.notificationService.showNotification("Erreur lors du chargement utilisateurs connectés", 'error');
      }
    });
  }

  fetchMessages(page: number = 1): void {
    this.isLoading = true;
    this.messageService.getMessages(page).subscribe({
      next: (response) => {
        this.messages = page === 1 
          ? response.messages
        // Ajouter les nouveaux messages à la liste existante
          : [...this.messages, ...response.messages];
        
        // Mettre à jour les messages
        //this.filteredMessages = this.messages;
        
        this.currentPage = response.currentPage;
        this.totalPages = response.totalPages;
        // Appliquer les filtres et tris actuels aux messages mis à jour
        this.filterAndSortMessages();

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur fetch messages:', err);
        this.notificationService.showNotification('Erreur lors du chargement des messages', 'error');
        this.isLoading = false;
      }
    });
  }

  loadMoreMessages(): void {
    if (this.currentPage < this.totalPages && !this.isLoadingMore) {
      this.isLoadingMore = true;
      
      this.messageService.getMessages(this.currentPage + 1).subscribe({
        next: (response) => {
          // Ajouter les nouveaux messages à la liste existante
          this.messages = [...this.messages, ...response.messages];
          
          this.currentPage = response.currentPage;
          this.totalPages = response.totalPages;
          
          // Appliquer les filtres et tris actuels aux messages mis à jour
          this.filterAndSortMessages();
          
          this.isLoadingMore = false;
        },
        error: (err) => {
          console.error('Erreur fetch messages supplémentaires:', err);
          this.notificationService.showNotification('Erreur lors du chargement de messages supplémentaires', 'error');
          this.isLoadingMore = false;
        }
      });
    }
  }

  filterAndSortMessages() {
    let messages = [...this.messages];
  
    // Filtrage par propriétaire
    if (this.ownerFilter === 'mine') {
      messages = messages.filter(msg => msg.createdBy.id === this.currentUser.id);
    } else if (this.ownerFilter === 'others') {
      messages = messages.filter(msg => msg.createdBy.id !== this.currentUser.id);
    }
  
    // Filtrage par hashtag
    if (this.hashtagFilter.trim()) {
      messages = messages.filter(msg =>
        msg.hashtags.some(tag => tag.toLowerCase().includes(this.hashtagFilter.toLowerCase()))
      );
    }
  
    // Tri
    if (this.sortOption === 'owner') {
      messages.sort((a, b) => a.createdBy.pseudo.localeCompare(b.createdBy.pseudo));
    } else if (this.sortOption === 'date') {
      messages.sort((a, b) =>
        new Date(`${b.date} ${b.hour}`).getTime() - new Date(`${a.date} ${a.hour}`).getTime()
      );
    } else if (this.sortOption === 'likes') {
      messages.sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0));
    }
  
    this.filteredMessages = messages;
  }
  
  // Générer un ID unique pour chaque notification
  generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  isUserConnected() {
    const user = this.authService.getUser();
    if (!user) {return false; }
    return true;
  }
  
  likeMessage(message: Message): void {
    if (!this.isUserConnected()) {
      this.notificationService.showNotification('Utilisateur non connecté.', 'error');
      return;
    }

    const idUser = this.authService.getUser().id;
    const payload = { userId: idUser };
    this.messageService.likeMessage(message._id, payload).subscribe({
      next: (res) => {
        console.log('Réponse likeMessage:', res);
        if (res.liked) {
          if (!message.likedBy) message.likedBy = [];
          if (!message.likedBy.includes(idUser)) {
            message.likes = (message.likes || 0) + 1;
            message.likedBy.push(idUser);
          }
          this.notificationService.showNotification('Message liké !', 'success');
        } else {
          if (message.likedBy?.includes(idUser)) {
            message.likes = Math.max(0, (message.likes || 0) - 1);
            message.likedBy = message.likedBy.filter(id => id !== idUser);
          }
          this.notificationService.showNotification('Like retiré.', 'info');
        }
      },
      error: (err) => {
        console.error('Erreur like:', err);
        this.notificationService.showNotification('Erreur lors du like', 'error');
      }
    });
  }

  listenToWebSocketEvents(): void {
    this.wsComment();
    this.wsConnexion();
    this.wsLike();
    this.wsShare();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (!this.enableInfiniteScroll || this.isLoading || this.isLoadingMore || this.currentPage >= this.totalPages) {
      return;
    }

    // Déclencher le chargement quand l'utilisateur est à ~80% de la page
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    
    const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
    
    if (scrollPercentage > 80) {
      this.loadMoreMessages();
    }
  }
  
  private wsShare() {
    this.wsService.onMessageShared().subscribe(({ originalMessageId, sharedBy, user, shared, unshared }) => {
      const message = this.messages.find(msg => msg._id === originalMessageId);

      if (message) {
        message.sharedBy = message.sharedBy || [];

        if (shared) {
          if (!message.sharedBy.includes(sharedBy)) {
            message.sharedBy.push(sharedBy);

            if (message.createdBy.id === this.currentUser.id && sharedBy !== this.currentUser.id) {
              const userName = user ? user.pseudo : "Quelqu'un";
              this.addNotification(`🔄 ${userName} a partagé votre message.`, 'share', originalMessageId, sharedBy);
            }
          }
        } else if (unshared) {
          message.sharedBy = message.sharedBy.filter(id => id !== sharedBy);

          if (message.createdBy.id === this.currentUser.id && sharedBy !== this.currentUser.id) {
            this.removeNotification('share', originalMessageId, sharedBy);
          }
        }
      }
    });
  }

  private wsComment() {
    this.wsService.onMessageCommented().subscribe(({ messageId, comment }) => {
      const message = this.messages.find(m => m._id === messageId);
      
      if (message) {
        message.comments = message.comments || [];

        const exists = message.comments.some(c => c._id === comment._id);
        if (!exists) { message.comments.push(comment); }

        if (message.createdBy.id === this.currentUser.id && comment.commentedBy.id !== this.currentUser.id) {
          this.addNotification(`💬 ${comment.commentedBy.pseudo} a commenté votre message.`, 'comment', messageId, comment.commentedBy.id);
        }
      }
    });

    this.wsService.onCommentDeleted().subscribe(({ messageId, commentId, deletedBy }) => {
      const message = this.messages.find(msg => msg._id === messageId);

      if (message) {
        message.comments = message.comments.filter(c => c._id !== commentId);

        // Notification si ce n'est pas notre propre suppression
        if (deletedBy !== this.currentUser.id && message.createdBy.id === this.currentUser.id) {
          this.removeNotification('comment', messageId, deletedBy);
        }
      }
    });
  }

  private wsLike() {
    this.wsService.onMessageLiked().subscribe(({ messageId, user, userId, liked }) => {
      console.log('Réception message-liked: messageId - user - userId', messageId, user, userId, liked);

      const message = this.messages.find(msg => msg._id === messageId);
      if (message) {
        if (userId !== this.currentUser.id) {
          if (liked) {
            if (!message.likedBy) message.likedBy = [];
            if (!message.likedBy.includes(userId)) {
              message.likes = (message.likes || 0) + 1;
              message.likedBy.push(userId);
            }
          } else {
            if (message.likedBy?.includes(userId)) {
              message.likes = Math.max(0, (message.likes || 0) - 1);
              message.likedBy = message.likedBy.filter(id => id !== userId);
              this.removeNotification('like', messageId, userId);
            }
          }
        }

        if (message.createdBy.id === this.currentUser.id && userId !== this.currentUser.id) {
          if (liked) {
            this.addNotification(`❤️ ${user.pseudo} a liké votre message.`, 'like', messageId, userId);
          } else {
            this.removeNotification('like', messageId, userId);
          }
        }
      }
    });
  }

  private wsConnexion() {
    this.wsService.emitUserConnection({
      userId: this.currentUser.id,
      pseudo: this.currentUser.pseudo,
      avatar: this.currentUser.avatar
    });

    this.wsService.onUpdatedConnectedUsers().subscribe(users => {
      this.connectedUsers = users;
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        this.wsService.emitEvent('user-disconnected', {
          userId: this.currentUser.id,
          pseudo: this.currentUser.pseudo
        });
      
        this.notificationService.showNotification("Vous êtes déconnecté(e).", 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log("Erreur lors de la déconnexion", err);
        this.notificationService.showNotification('Erreur lors de la déconnexion', 'error');
      }
    });
  }
  
  removeNotification(type: string, entityId: string, userId: number): void {
    this.notifications = this.notifications.filter(notification => 
      !(notification.type === type && 
        notification.entityId === entityId && 
        notification.userId === userId)
    );
  }

  shareMessage(message: Message): void {
    if (!this.isUserConnected()) {
      this.notificationService.showNotification('Utilisateur non connecté.', 'error');
      return;
    }
    
    const payload = { userId: this.authService.getUser().id };
    this.messageService.shareMessage(message._id, payload).subscribe({
      next: (res) => {
        console.log('Réponse shareMessage:', res);
        if (!message.sharedBy) message.sharedBy = [];
        if (res.unshared) {
          message.sharedBy = message.sharedBy.filter(id => id !== payload.userId);
          this.notificationService.showNotification('Partage annulé', 'info');
        } else if (res.shared) {
          if (!message.sharedBy.includes(payload.userId)) {
            message.sharedBy.push(payload.userId);
          }
          this.notificationService.showNotification('Message partagé !', 'success');
        }
      },
      error: (err) => {
        console.error('Erreur partage:', err);
        this.notificationService.showNotification('Erreur lors du partage', 'error');
      }
    });
  }
  
  sortMessages() {
    this.filterAndSortMessages();
  }

  addComment(message: Message): void {
    if (!this.isUserConnected()) {
      this.notificationService.showNotification('Utilisateur non connecté.', 'error');
      return;
    }
    
    const commentText = this.newComment[message._id];
    if (!commentText || commentText.trim() === '') {
      this.notificationService.showNotification("Champ vide ! Veuillez écrire quelque chose avant d'envoyer", 'info');
      return;
    }
    
    if (!this.authService.getUser()) {
      this.notificationService.showNotification("Erreur utilisateur : impossible d'envoyer un commentaire.", 'error');
      return;
    }
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR');
    const formattedHour = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const newComment: MessageComment = {
      _id: '', // mon backend le générera.
      text: commentText,
      commentedBy: {
        id: this.authService.getUser().id,
        pseudo: this.currentUser.pseudo,
        avatar: this.authService.getUser().avatar
      },
      date: formattedDate,
      hour: formattedHour
    };
    
    this.messageService.addComment(message._id, newComment).subscribe({
      next: (addedComment: any) => {
        message.comments = message.comments || [];
        message.comments.push(addedComment);
        this.newComment[message._id] = '';
        this.notificationService.showNotification('Commentaire ajouté !', 'success');
      },
      error: (err) => {
        console.log("Erreur lors de l'ajout du commentaire", err)
        this.notificationService.showNotification("Erreur lors de l'ajout du commentaire", 'error');
      }
    });
  }
  
  toggleComments(messageId: string): void {
    this.showComments[messageId] = !this.showComments[messageId];
  }

  toggleNotificationPanel(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
    if (this.showNotificationPanel) {
      this.unreadCount = 0;
    }
  }
}
