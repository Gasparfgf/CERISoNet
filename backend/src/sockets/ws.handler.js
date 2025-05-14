const { Server } = require('socket.io');
const { pool } = require('../utils/db.utils');

function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ['https://pedago.univ-avignon.fr:3215'],
      methods: ['GET', 'POST', 'DELETE', 'UPDATE'],
      credentials: true,
    },
  });

  const connectedUsers = new Map(); // userId => socket.id

  io.on('connection', (socket) => {
    socket.on('user-connected', async (userData) => {
      const { userId, pseudo, avatar } = userData;
      console.log(`👤 Utilisateur ${userId} connecté`);
      
      connectedUsers.set(userId, socket.id);
      
      // Récupérer les utilisateurs connectés
      const { rows } = await pool.query(
        'SELECT id, pseudo, avatar FROM fredouil.compte WHERE statut_connexion = 1'
      );
      
      // Émettre la liste des utilisateurs connectés à tous
      io.emit('updated-connected-users', rows);
    });

    socket.on('user-disconnected', async (userData) => {
      console.log(`🔴 Utilisateur ${userData.userId} déconnecté`);
      
      // Supprimer l'utilisateur de la liste des connectés
      connectedUsers.delete(userData.userId);
      
      // Émettre l'événement de déconnexion à tous les clients
      io.emit('user-disconnected', {
        userId: userData.userId,
        pseudo: userData.pseudo
      });
      
      // Récupérer les utilisateurs connectés
      const { rows } = await pool.query(
        'SELECT id, pseudo, avatar FROM fredouil.compte WHERE statut_connexion = 1'
      );
      
      // Émettre la liste mise à jour
      io.emit('updated-connected-users', rows);
    });
  });

  return io;
}

module.exports = setupWebSocket;
