const { Server } = require('socket.io');

function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ['https://pedago.univ-avignon.fr:3215'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const connectedUsers = new Map(); // userId => socket.id

  io.on('connection', (socket) => {
    console.log('🟢 Utilisateur connecté via WebSocket');

    // Lorsqu'un utilisateur s’identifie (événement custom déclenché côté client)
    socket.on('userConnected', (userId) => {
      console.log(`👤 Utilisateur ${userId} connecté`);
      connectedUsers.set(userId, socket.id);
      io.emit('user-connected', { userId, connected: true });
    });

    socket.on('disconnect', () => {
      console.log(`🔴 Déconnexion : socket ${socket.id}`);

      // Trouver l'userId associé
      for (let [userId, sockId] of connectedUsers.entries()) {
        if (sockId === socket.id) {
          connectedUsers.delete(userId);
          io.emit('user-disconnected', { userId, connected: false });
          break;
        }
      }
    });

    // Pour debug
    socket.on('debug', () => {
      console.log('🧪 Utilisateurs connectés:', connectedUsers);
    });
  });

  return io;
}

module.exports = setupWebSocket;
