const { connectToMongo, ObjectId, pool } = require('../utils/db.utils');


addComment = async (req, res) => {
  let messageId = req.params.id;
  // Essayer de convertir en nombre si c'est une chaîne numérique
  if (!isNaN(messageId)) {
    messageId = parseInt(messageId);
  }
  const { text, commentedBy, date, hour } = req.body;

  const userId = commentedBy.id;
  console.log("addComment.messageId reçu:", req.params.id); // pour like
  console.log("addComment.userId reçu:", userId);

  const commentToSave = { _id: new ObjectId(), text, commentedBy: userId, date, hour };

  console.log('commentToSave =', commentToSave);

  try {
    const db = await connectToMongo();
    const messagesCollection = db.collection('CERISoNet');
    messagesCollection.updateOne(
      { _id: messageId },
      { $push: { comments: commentToSave } }
    );


    // Chercher le pseudo correspondant à l'ID
    const { rows } = await pool.query(
      'SELECT pseudo, avatar FROM fredouil.compte WHERE id = $1',
      [parseInt(userId)]
    );
    const user = rows[0] || { pseudo: 'Inconnu', avatar: null };

    const commentToSend = {
      _id: commentToSave._id,
      text,
      date,
      hour,
      commentedBy: {
        id: userId,
        pseudo: user.pseudo,
        avatar: user.avatar
      }
    };

    const io = req.app.get('socketio');
    io.emit('message-commented', { messageId, comment: commentToSend });
    return res.json(commentToSend);
  } catch (err) {
    console.error('Erreur dans addComment:', err);
    return res.status(500).json({ success: false, message: "Erreur lors de l'ajout du commentaire" });
  }
};

deleteComment = async (req, res) => {
  let messageId = parseInt(req.params.messageId);
  const commentId = req.params.commentId;
  const { userId } = req.body;
  console.log("deleteComment.messageId reçu:", req.params.messageId); // Correction ici
  console.log("deleteComment.userId reçu:", req.body);
  console.log("deleteComment.commentId reçu:", req.params.commentId);

  try {
    const db = await connectToMongo();
    const messagesCollection = db.collection('CERISoNet');

    const message = await messagesCollection.findOne({ _id: messageId });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message non trouvé"
      });
    }

    const comment = message.comments?.find(c => c._id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Commentaire non trouvé"
      });
    }
    
    if (comment.commentedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez supprimer que vos propres commentaires"
      });
    }

    // Supprime le commentaire
    await messagesCollection.updateOne(
      { _id: messageId },
      { $pull: { comments: { _id: new ObjectId(commentId) } } }
    );

    // Émettre un événement socket pour tous les clients
    const io = req.app.get('socketio');
    io.emit('comment-deleted', { 
      messageId, 
      commentId,
      deletedBy: userId 
    });

    return res.json({ success: true, message: 'Commentaire supprimé' });
  } catch (err) {
    console.error("Erreur lors de la suppression du commentaire :", err);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression' });
  }
};

getMessages = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const db = await connectToMongo();
    const messagesCollection = db.collection('CERISoNet');
    
    // Compter le nombre total de messages
    const totalMessages = await messagesCollection.countDocuments();
    
    // Récupérer les messages paginés
    const messages = await messagesCollection
      .find()
      .sort({ date: -1, hour: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // 1. Récupérer tous les IDs nécessaires
    const userIds = new Set();
    messages.forEach(msg => {
      if (msg.createdBy) userIds.add(msg.createdBy.toString());
      msg.comments?.forEach(comment => {
        if (comment.commentedBy) userIds.add(comment.commentedBy.toString());
      });
    });

    // 2. Aller chercher id, pseudo, avatar depuis PostgreSQL
    const parsedIds = Array.from(userIds)
      .map(id => parseInt(id))
      .filter(id => !isNaN(id));

    let usersMap = {};
    if (parsedIds.length > 0) {
      const { rows } = await pool.query(
        'SELECT id, pseudo, avatar FROM fredouil.compte WHERE id = ANY($1::int[])',
        [parsedIds]
      );
      rows.forEach(user => {
        usersMap[user.id] = {
          id: user.id,
          pseudo: user.pseudo,
          avatar: user.avatar
        };
      });
    }

    // 3. Remplacer IDs par { id, pseudo, avatar }
    const messagesWithUsers = messages.map(msg => {
      return {
        ...msg,
        createdBy: usersMap[msg.createdBy] || { id: msg.createdBy, pseudo: 'Inconnu', avatar: null },
        comments: (msg.comments || []).map(comment => ({
          ...comment,
          commentedBy: usersMap[comment.commentedBy] || { id: comment.commentedBy, pseudo: 'Inconnu', avatar: null }
        }))
      };
    });

    return res.json({
      messages: messagesWithUsers,
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages
    });
  } catch (err) {
    console.error("Erreur dans getMessages:", err);
    return res.status(500).json({ success: false, message: 'Erreur lors du chargement des messages' });
  }
};

likeMessage = async (req, res) => {
  let messageId = req.params.id;
  // Essayer de convertir en nombre si c'est une chaîne numérique
  if (!isNaN(messageId)) {
    messageId = parseInt(messageId);
  }
  const userId = req.body.userId;

  try {
    const db = await connectToMongo();
    const messagesCollection = db.collection('CERISoNet');
    const message = await messagesCollection.findOne({ _id: messageId });
    if (!message) {
      return res.status(404).json({ success: false, message: "Message non trouvé" });
    }

    let update;
    const alreadyLiked = message.likedBy && message.likedBy.includes(userId);
    if (alreadyLiked) {
      update = {
        $pull: { likedBy: userId },
        $inc: { likes: -1 }
      };
    } else {
      update = {
        $addToSet: { likedBy: userId },
        $inc: { likes: 1 }
      };
    }

    await db.collection('CERISoNet').updateOne({ _id: messageId }, update);

    const { rows } = await pool.query(
      'SELECT pseudo, avatar FROM fredouil.compte WHERE id = $1', 
      [userId]
    );
    const user = rows[0] || { pseudo: 'Inconnu', avatar: null };
    
    const io = req.app.get('socketio');
    io.emit('message-liked', { 
      messageId, 
      userId, 
      user: {
        id: userId,
        pseudo: user.pseudo,
        avatar: user.avatar
      },
      liked: !alreadyLiked 
    });

    return res.json({ success: true, liked: !alreadyLiked });
  } catch (err) {
    console.error('Erreur dans likeMessage:', err);
    return res.status(500).json({ success: false, message: 'Erreur lors du traitement du like' });
  }
};


shareMessage = async (req, res) => {
  const messageId = parseInt(req.params.id);
  const { userId } = req.body;
  console.log("shareMessage.messageId reçu:", req.params.id);
  console.log("shareMessage.userId reçu:", req.body);

  try {
    const db = await connectToMongo();
    const messagesCollection = db.collection('CERISoNet');

    // Récupérer le message d'origine
    const originalMessage = await messagesCollection.findOne({ _id: messageId });
    if (!originalMessage) {
      return res.status(404).json({ success: false, message: "Message non trouvé" });
    }

    // Vérifier si ce message est déjà partagé par l'utilisateur
    const alreadyShared = await messagesCollection.findOne({
      shared: messageId,
      'createdBy.id': userId
    });

    const { rows } = await pool.query(
      'SELECT pseudo, avatar FROM fredouil.compte WHERE id = $1',
      [userId]
    );
    const user = rows[0] || { pseudo: 'Inconnu', avatar: null };

    const io = req.app.get('socketio');

    if (alreadyShared) {
      // Supprimer le message partagé
      await messagesCollection.deleteOne({ _id: alreadyShared._id });

      // Supprimer l'userId du tableau sharedBy du message original
      await messagesCollection.updateOne(
        { _id: messageId },
        { $pull: { sharedBy: userId } }
      );

      io.emit('message-shared', {
        originalMessageId: messageId,
        sharedBy: userId,
        user: {
          id: userId,
          pseudo: user.pseudo,
          avatar: user.avatar
        },
        unshared: true
      });

      return res.json({ success: true, unshared: true });
    }

    // Créer le nouveau message partagé
    const now = new Date();
    const sharedMessage = {
      _id: new ObjectId(), 
      date: now.toISOString().split('T')[0],
      hour: now.toTimeString().split(' ')[0].substring(0, 5),
      body: originalMessage.body,
      createdBy: { id: userId, pseudo: user.pseudo, avatar: user.avatar },
      images: originalMessage.images || null,
      likes: 0,
      likedBy: [],
      hashtags: originalMessage.hashtags || [],
      comments: [],
      shared: messageId,
      sharedBy: [], 
    };

    const insertResult = await messagesCollection.insertOne(sharedMessage);

    // Ajouter userId au tableau sharedBy du message original
    await messagesCollection.updateOne(
      { _id: messageId },
      { $addToSet: { sharedBy: userId } }
    );

    io.emit('message-shared', {
      originalMessageId: messageId,
      sharedBy: userId,
      user: {
        id: userId,
        pseudo: user.pseudo,
        avatar: user.avatar
      },
      shared: true
    });

    res.status(201).json({ 
      success: true, 
      id: insertResult.insertedId, 
      shared: true 
    });
  } catch (err) {
    console.error('Erreur dans shareMessage:', err);
    res.status(500).json({ success: false, message: 'Erreur lors du partage du message' });
  }
};

module.exports = { getMessages, shareMessage, likeMessage, addComment, deleteComment }