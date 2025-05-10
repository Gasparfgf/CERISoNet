import { Component, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from '../../services/socket/socket.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  constructor(private wsService: SocketService) {}

  ngOnInit(): void {
    this.wsService.onMessage('message', (data) => {
      console.log('Message reçu :', data);
    });
  }

  envoyerMessage() {
    this.wsService.emit('message', { content: 'Hello depuis Angular' });
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
  }

}
