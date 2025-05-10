import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../models/message';
import { AuthService } from '../../services/authentication/auth.service';
import { MessageService } from '../../services/message/message.service';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent {
  @Output() like = new EventEmitter<Message>();
  @Output() share = new EventEmitter<Message>();
  @Output() delete = new EventEmitter<{ message: Message, commentId: string }>();
  messages: Message[] = [];
  isLoading = true;
  currentUser: any;
  showComments: { [messageId: string]: boolean } = {};
  newComment: { [key: string]: string } = {};

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.fetchMessages();
  }

  fetchMessages(): void {
    this.messageService.getMessages().subscribe({
      next: (data) => {
        this.messages = data;
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.showNotification('Erreur de chargement', 'error');
        this.isLoading = false;
      }
    });
  }
  
  likeMessage(message: Message): void {
    const userId = this.currentUser.id;
    this.messageService.likeMessage(message._id, { userId }).subscribe({
      next: (res) => {
        if (res.liked) {
          message.likes += 1;
          message.likedBy.push(userId);
        } else {
          message.likes -= 1;
          message.likedBy = message.likedBy.filter(id => id !== userId);
        }
      }
    });
  }

  submitComment(message: Message): void {
    const content = this.newComment[message._id];
    if (!content) return;
    
    const comment = {
      _id: '',
      text: content,
      commentedBy: {
        id: this.currentUser.id,
        pseudo: this.currentUser.pseudo,
        avatar: this.currentUser.avatar
      },
      date: new Date().toLocaleDateString('fr-FR'),
      hour: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    
    this.messageService.addComment(message._id, comment).subscribe({
      next: (c) => {
        message.comments.push(c);
        this.newComment[message._id] = '';
      }
    });
  }
  
  toggleComments(id: string): void {
    this.showComments[id] = !this.showComments[id];
  }
  
  
  deleteComment(message: Message, commentId: string): void {
    const userId = this.authService.getUser().id;
    console.log("comment id : ", commentId);
    console.log("message id : ", message._id);
  
    this.messageService.deleteComment(message._id, commentId, userId).subscribe({
      next: () => {
        message.comments = message.comments.filter(c => c._id !== commentId);
        this.notificationService.showNotification("Commentaire supprimé", "success");
      },
      error: (err) => {
        if (err.status === 403) {
          this.notificationService.showNotification("Vous ne pouvez supprimer que vos propres commentaires", "info");
        } else {
          this.notificationService.showNotification("Erreur lors de la suppression", "error");
        }
      }
    });
  }
  
}
