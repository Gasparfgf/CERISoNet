export interface StudyGroup {
    id?: number;
    name: string;
    description: string;
    createdBy: number; // ID de l'utilisateur créateur
    createdDate: string;
    meetingTime?: string;
    location?: string;
    subject: string;
    members: number[]; // IDs des utilisateurs membres
    tags: string[];    // mots-clés associés au groupe
  }