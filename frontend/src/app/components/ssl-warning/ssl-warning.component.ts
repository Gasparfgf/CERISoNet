import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ssl-warning',
  standalone: true,
  imports: [],
  templateUrl: './ssl-warning.component.html',
  styleUrl: './ssl-warning.component.css'
})
export class SslWarningComponent implements OnInit {
  @Output() dismissed = new EventEmitter<void>();
  
  // URL de l'API pour tester le certificat SSL
  apiUrlForTesting = `${environment.quarkusUrl}/api/study-groups`;
  
  constructor() { }

  ngOnInit(): void {
  }
  
  dismissWarning(): void {
    localStorage.setItem('sslWarningDismissed', 'true');
    this.dismissed.emit();
  }
}
