import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { StudyGroup } from '../../models/study-group';
import { AuthService } from '../../services/authentication/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { StudyGroupService } from '../../services/study-group/study-group.service';
import { BannerComponent } from '../banner/banner.component';
import { SslWarningComponent } from '../ssl-warning/ssl-warning.component';

@Component({
  selector: 'app-study-group',
  standalone: true,
  imports: [
    FormsModule, CommonModule, BannerComponent, ReactiveFormsModule, RouterModule, SslWarningComponent
  ],
  templateUrl: './study-group.component.html',
  styleUrls: ['./study-group.component.css']
})
export class StudyGroupsComponent implements OnInit {
  studyGroups: StudyGroup[] = [];
  filteredGroups: StudyGroup[] = [];
  selectedGroup: StudyGroup | null = null;
  currentUser: any;
  isLoading = true;
  isCreatingGroup = false;
  isEditingGroup = false;
  groupForm: FormGroup;
  searchTerm: string = '';
  searchFilter: string = 'all';

  showSslWarning = false;
  apiBaseUrl = environment.quarkusUrl;

  constructor(
    private studyGroupService: StudyGroupService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private http: HttpClient
  ) { 
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      subject: ['', Validators.required],
      meetingTime: [''],
      location: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.testSslConnection();
  }

  testSslConnection(): void {
    // Si l'utilisateur a déjà vu et fermé l'avertissement, ne pas le montrer à nouveau
    if (localStorage.getItem('sslWarningDismissed') === 'true') {
      this.loadStudyGroups();
      return;
    }
    
    const testHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // Test simple pour vérifier si le serveur est accessible
    this.http.get(`${this.apiBaseUrl}/q/health`, { headers: testHeaders, observe: 'response' })
      .subscribe({
        next: (response) => {
          // Si le serveur répond, charger les groupes
          this.showSslWarning = false;
          this.loadStudyGroups();
        },
        error: (error) => {
          if (error.status === 0) {
            // Status 0 indique généralement un problème de connexion/certificat
            this.showSslWarning = true;
            this.isLoading = false;
          } else {
            // Tout autre code d'erreur signifie que nous avons réussi à contacter le serveur
            // mais il y a un autre problème - donc pas de problème SSL
            this.showSslWarning = false;
            this.loadStudyGroups();
          }
        }
      });
  }

  // Méthode appelée lorsque l'avertissement SSL est fermé
  onSslWarningDismissed(): void {
    this.showSslWarning = false;
    this.loadStudyGroups();
  }

  loadStudyGroups(): void {
    this.isLoading = true;
    this.studyGroupService.getStudyGroups().subscribe({
      next: (groups) => {
        this.studyGroups = groups;
        this.filteredGroups = [...groups];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des groupes:', err);
        
        // Si l'erreur est due à un problème SSL, montrer l'avertissement
        if (err.status === 0) {
          this.showSslWarning = true;
        } else {
          this.notificationService.showNotification('Erreur lors du chargement des groupes d\'étude', 'error');
        }
        
        this.isLoading = false;
      }
    });
  }

  showCreateForm(): void {
    this.isCreatingGroup = true;
    this.isEditingGroup = false;
    this.groupForm.reset();
  }

  showEditForm(group: StudyGroup): void {
    this.isEditingGroup = true;
    this.isCreatingGroup = false;
    this.selectedGroup = group;
    
    this.groupForm.patchValue({
      name: group.name,
      description: group.description,
      subject: group.subject,
      meetingTime: group.meetingTime || '',
      location: group.location || '',
      tags: group.tags.join(', ')
    });
  }

  cancelForm(): void {
    this.isCreatingGroup = false;
    this.isEditingGroup = false;
    this.selectedGroup = null;
    this.groupForm.reset();
  }

  createGroup(): void {
    if (this.groupForm.invalid) {
      this.notificationService.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    const formValues = this.groupForm.value;
    const tags = formValues.tags ? formValues.tags.split(',').map((tag: string) => tag.trim()) : [];
    
    const newGroup: StudyGroup = {
      name: formValues.name,
      description: formValues.description,
      subject: formValues.subject,
      meetingTime: formValues.meetingTime,
      location: formValues.location,
      tags: tags,
      createdBy: this.currentUser.id,
      createdDate: new Date().toISOString(),
      members: [this.currentUser.id] // Le créateur est automatiquement membre
    };

    this.studyGroupService.createStudyGroup(newGroup).subscribe({
      next: (createdGroup) => {
        this.studyGroups.push(createdGroup);
        this.filteredGroups = [...this.studyGroups];
        this.notificationService.showNotification('Groupe d\'étude créé avec succès !', 'success');
        this.isCreatingGroup = false;
        this.groupForm.reset();
      },
      error: (err) => {
        console.error('Erreur lors de la création du groupe:', err);
        this.notificationService.showNotification('Erreur lors de la création du groupe', 'error');
      }
    });
  }

  updateGroup(): void {
    if (!this.selectedGroup || this.groupForm.invalid) {
      return;
    }

    const formValues = this.groupForm.value;
    const tags = formValues.tags ? formValues.tags.split(',').map((tag: string) => tag.trim()) : [];
    
    const updatedGroup: StudyGroup = {
      ...this.selectedGroup,
      name: formValues.name,
      description: formValues.description,
      subject: formValues.subject,
      meetingTime: formValues.meetingTime,
      location: formValues.location,
      tags: tags
    };

    this.studyGroupService.updateStudyGroup(this.selectedGroup.id!, updatedGroup).subscribe({
      next: (group) => {
        // Mettre à jour le groupe dans la liste
        const index = this.studyGroups.findIndex(g => g.id === group.id);
        if (index !== -1) {
          this.studyGroups[index] = group;
          this.filteredGroups = [...this.studyGroups];
        }
        this.notificationService.showNotification('Groupe d\'étude mis à jour avec succès !', 'success');
        this.isEditingGroup = false;
        this.selectedGroup = null;
        this.groupForm.reset();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du groupe:', err);
        this.notificationService.showNotification('Erreur lors de la mise à jour du groupe', 'error');
      }
    });
  }

  deleteGroup(group: StudyGroup): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${group.name}" ?`)) {
      this.studyGroupService.deleteStudyGroup(group.id!).subscribe({
        next: () => {
          this.studyGroups = this.studyGroups.filter(g => g.id !== group.id);
          this.filteredGroups = [...this.studyGroups];
          this.notificationService.showNotification('Groupe d\'étude supprimé avec succès !', 'success');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du groupe:', err);
          this.notificationService.showNotification('Erreur lors de la suppression du groupe', 'error');
        }
      });
    }
  }

  joinGroup(group: StudyGroup): void {
    this.studyGroupService.joinGroup(group.id!, this.currentUser.id).subscribe({
      next: (updatedGroup) => {
        // Mettre à jour le groupe dans la liste
        const index = this.studyGroups.findIndex(g => g.id === updatedGroup.id);
        if (index !== -1) {
          this.studyGroups[index] = updatedGroup;
          this.filteredGroups = [...this.studyGroups];
        }
        this.notificationService.showNotification(`Vous avez rejoint le groupe "${group.name}" !`, 'success');
      },
      error: (err) => {
        console.error('Erreur lors de la tentative de rejoindre le groupe:', err);
        this.notificationService.showNotification('Erreur lors de la tentative de rejoindre le groupe', 'error');
      }
    });
  }

  leaveGroup(group: StudyGroup): void {
    this.studyGroupService.leaveGroup(group.id!, this.currentUser.id).subscribe({
      next: (updatedGroup) => {
        // Mettre à jour le groupe dans la liste
        const index = this.studyGroups.findIndex(g => g.id === updatedGroup.id);
        if (index !== -1) {
          this.studyGroups[index] = updatedGroup;
          this.filteredGroups = [...this.studyGroups];
        }
        this.notificationService.showNotification(`Vous avez quitté le groupe "${group.name}"`, 'info');
      },
      error: (err) => {
        console.error('Erreur lors de la tentative de quitter le groupe:', err);
        this.notificationService.showNotification('Erreur lors de la tentative de quitter le groupe', 'error');
      }
    });
  }

  viewGroupDetails(group: StudyGroup): void {
    this.selectedGroup = group;
    
    // Analyse de mots-clés comme exemple d'algorithme supplémentaire
    this.studyGroupService.analyzeKeywords(group.id!).subscribe({
      next: (response) => {
        console.log('Mots-clés extraits:', response.keywords);
        // Vous pouvez ajouter ces mots-clés à l'interface utilisateur si vous le souhaitez
      },
      error: (err) => {
        console.error('Erreur lors de l\'analyse des mots-clés:', err);
      }
    });
  }

  isUserMember(group: StudyGroup): boolean {
    return group.members.includes(this.currentUser.id);
  }

  isGroupCreator(group: StudyGroup): boolean {
    return group.createdBy === this.currentUser.id;
  }

  searchGroups(): void {
    if (!this.searchTerm.trim()) {
      this.filteredGroups = [...this.studyGroups];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    
    if (this.searchFilter === 'tag') {
      this.studyGroupService.getStudyGroupsByTag(term).subscribe({
        next: (groups) => {
          this.filteredGroups = groups;
        },
        error: (err) => {
          console.error('Erreur lors de la recherche par tag:', err);
          this.notificationService.showNotification('Erreur lors de la recherche', 'error');
        }
      });
    } else if (this.searchFilter === 'subject') {
      this.studyGroupService.getStudyGroupsBySubject(term).subscribe({
        next: (groups) => {
          this.filteredGroups = groups;
        },
        error: (err) => {
          console.error('Erreur lors de la recherche par matière:', err);
          this.notificationService.showNotification('Erreur lors de la recherche', 'error');
        }
      });
    } else {
      // Recherche locale si searchFilter est 'all'
      this.filteredGroups = this.studyGroups.filter(group => 
        group.name.toLowerCase().includes(term) || 
        group.description.toLowerCase().includes(term) ||
        group.subject.toLowerCase().includes(term) ||
        group.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
  }
}