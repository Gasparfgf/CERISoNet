export interface Notification {
    id: string;         // Identifiant unique pour pouvoir supprimer une notification spécifique
    message: string;    // Contenu de la notification
    type: string;       // Type de notification (like, comment, share, etc.)
    entityId?: string;  // ID du message ou commentaire concerné
    userId?: number;    // ID de l'utilisateur qui a généré la notification
    timestamp: number;  // Timestamp pour trier les notifications par date
}
