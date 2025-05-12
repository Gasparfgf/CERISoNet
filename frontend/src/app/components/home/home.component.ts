import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { Router } from '@angular/router';
import { MessageComment } from '../../models/comment';
import { Message } from '../../models/message';
import { AuthService } from '../../services/authentication/auth.service';
import { MessageService } from '../../services/message/message.service';
import { NotificationService } from "../../services/notification/notification.service";
import { SocketService } from '../../services/socket/socket.service';
import { BannerComponent } from '../banner/banner.component';
import { LeftSidebarComponent } from '../left-sidebar/left-sidebar.component';
import { RightSidebarComponent } from '../right-sidebar/right-sidebar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule, CommonModule, BannerComponent, RightSidebarComponent, LeftSidebarComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  messages: Message[] = [];
  isLoading = true;
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

  notifications: string[] = [];
  unreadCount: number = 0;
  showNotificationPanel = false;

  constructor(
    private notificationService: NotificationService,
    private messageService: MessageService,
    private authService: AuthService,
    private wsService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (!this.currentUser) { // vérification que l’utilisateur est bien récupéré
      this.router.navigate(['/login']);
      return;
    }

    this.lastLogin = this.authService.getLastLogin();

    this.fetchMessages();
    this.fetchConnectedUsers();
    this.listenToWebSocketEvents();
  }

  deleteComment(message: Message, commentId: string): void {
    const userId = this.authService.getUser().id;
  
    this.messageService.deleteComment(message._id, commentId, userId).subscribe({
      next: (response) => {
        console.log('Réponse suppression:', response);
        if (response.success) {
          message.comments = message.comments.filter(c => c._id !== commentId);
          this.notificationService.showNotification("Commentaire supprimé", "success");
        }
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        if (err.status === 403) {
          this.notificationService.showNotification("Vous ne pouvez supprimer que vos propres commentaires", "info");
        } else if (err.status === 404) {
          this.notificationService.showNotification("Commentaire non trouvé", "info");
        } else {
          this.notificationService.showNotification("Erreur lors de la suppression", "error");
        }
      }
    });
  }
  
  fetchConnectedUsers(): void {
    this.authService.getConnectedUsers().subscribe({
      next: (data) => {
        this.connectedUsers = data;
      },
      error: () => {
        this.notificationService.showNotification("Erreur lors du chargement utilisateurs connectés", 'error');
      }
    });
  }

  fetchMessages(): void {
    this.messageService.getMessages().subscribe({
      next: (data) => {
        this.messages = data;
        this.filterAndSortMessages();
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.showNotification('Erreur lors du chargement des messages', 'error');
        this.isLoading = false;
      }
    });
  }

  filterAndSortMessages() {
    this.originalMessages = this.messages;
    let messages = [...this.originalMessages];
  
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
  
  
  filterMessages() {
    this.filterAndSortMessages();
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
    // Connexions
    this.wsService.onUserConnected().subscribe(user => {
      if (user.id !== this.currentUser.id) {
        this.notifications.unshift(`👤 ${user.pseudo} s’est connecté.`);
        this.unreadCount++;
        console.log("${user.pseudo} s'est connecté(e) 👋");
        this.notificationService.showNotification(`${user.pseudo} s'est connecté(e) 👋`, 'info');
      }
      this.connectedUsers.push(user);
    });
  
    this.wsService.onUserDisconnected().subscribe(({ userId, pseudo }) => {
      this.connectedUsers = this.connectedUsers.filter(u => u.id !== userId);
      console.log("${pseudo} s'est déconnecté(e) 😴");
      this.notificationService.showNotification(`${pseudo} s'est déconnecté(e) 😴`, 'info');
    });
  
    // Likes
    this.wsService.onMessageLiked().subscribe(({ messageId, user, userId, liked }) => {
      console.log('Réception message-liked: messageId - user - userId', messageId, user, userId, liked);
      const message = this.messages.find(msg => msg._id === messageId);
      if (message) {
        if (userId !== this.currentUser.id) {
          if (liked) {
            // Quelqu'un a liké
            if (!message.likedBy) message.likedBy = [];
            if (!message.likedBy.includes(userId)) {
              message.likes = (message.likes || 0) + 1;
              message.likedBy.push(userId);
            }
          } else {
            // Quelqu'un a retiré son like
            if (message.likedBy?.includes(userId)) {
              message.likes = Math.max(0, (message.likes || 0) - 1);
              message.likedBy = message.likedBy.filter(id => id !== userId);
            }
          }
        }

        if (message.createdBy.id === this.currentUser.id && userId !== this.currentUser.id) {
          const action = liked ? 'liké' : 'retiré son like de';
          this.notifications.unshift(`❤️ ${user.pseudo} a ${action} votre message.`);
          this.unreadCount++;
        }
      }
    });
  
    // Commentaires
    this.wsService.onMessageCommented().subscribe(({ messageId, comment }) => {
      const message = this.messages.find(m => m._id === messageId);
      if (message) {
        message.comments = message.comments || [];
        
        const exists = message.comments.some(c => c._id === comment._id);
        if (!exists) {
          message.comments.push(comment);
        }
  
        if (message.createdBy.id === this.currentUser.id) {
          this.notifications.unshift(`💬 ${comment.commentedBy.pseudo} a commenté votre message.`);
          this.unreadCount++;
        }
      }
    });
  
    // Partages
    this.wsService.onMessageShared().subscribe(({ originalMessageId, sharedBy, user }) => {
      const message = this.messages.find(msg => msg._id === originalMessageId);
      
      if (message) {
        message.sharedBy = message.sharedBy || [];
        
        if (!message.sharedBy?.includes(sharedBy)) {
          message.sharedBy.push(sharedBy);
          
          if (message.createdBy.id === this.currentUser.id && sharedBy !== this.currentUser.id) {
            const userName = user ? user.pseudo : "Quelqu'un";
            this.notifications.unshift(`🔄 ${userName} a partagé votre message.`);
            this.unreadCount++;
          }
        }
        this.unreadCount++;
      }
    });
  }  
  
  logout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        this.wsService.emitEvent('user-disconnected', {
          userId: this.currentUser.id
        });
      
        this.notificationService.showNotification(response.message, 'success');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.notificationService.showNotification('Erreur lors de la déconnexion', 'error');
      }
    });
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
  
  showNotifications(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
    this.notificationService.showNotification("Pas encore de notifications", "info");
  }
  
  sortMessages() {
    this.filterAndSortMessages();
  }

  submitComment(message: Message): void {
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
      error: () => {
        this.notificationService.showNotification("Erreur lors de l'ajout du commentaire", 'error');
      }
    });
  }
  
  toggleComments(messageId: string): void {
    this.showComments[messageId] = !this.showComments[messageId];
  }
}
