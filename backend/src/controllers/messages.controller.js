const { connectToMongo, ObjectId, pool } = require('../utils/db.utils');

postMessage = async (req, res) => {
  const { date, hour, body, createdBy, image, hashtags } = req.body;
  const message = {
    date,
    hour,
    body,
    createdBy,
    image: image || null,
    likes: 0,
    hashtags: hashtags || [],
    comments: [],
    shared: null
  };

  try {
    const db = await connectToMongo();
    const result = await db.collection('CERISoNet').insertOne(message);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de l\'enregistrement du message' });
  }
};

addComment = async (req, res) => {
  const messageId = parseInt(req.params.id);
  const { text, commentedBy, date, hour } = req.body;

  const userId = commentedBy.id;
  console.log("addComment.messageId reçu:", req.params.id); // pour like
  console.log("addComment.userId reçu:", userId);

  const commentToSave = { _id: new ObjectId(), text, commentedBy: userId, date, hour };

  console.log('commentToSave =', commentToSave);

  try {
    const db = await connectToMongo();
    await db.collection('CERISoNet').updateOne(
      { _id: messageId },
      { $push: { comments: commentToSave } }
    );

    const io = req.app.get('socketio');

    // Chercher le pseudo correspondant à l'ID
    const { rows } = await pool.query(
      'SELECT pseudo FROM fredouil.compte WHERE id = $1',
      [parseInt(userId)]
    );

    const pseudo = rows[0]?.pseudo || 'Inconnu';

    const commentToSend = {
      text,
      date,
      hour,
      commentedBy: {
        id: userId,
        pseudo
      }
    };

    io.emit('message-commented', { messageId, comment: commentToSend });
    res.json(commentToSend);
  } catch (err) {
    console.error('Erreur dans addComment:', err);
    res.status(500).json({ success: false, message: "Erreur lors de l'ajout du commentaire" });
  }
};


likeMessage = async (req, res) => {
  const messageId = parseInt(req.params.id);
  const userId = req.body.userId;
  console.log("likeMessage.messageId reçu:", req.params.id); // pour like
  console.log("likeMessage.userId reçu:", req.body.userId);

  try {
    const db = await connectToMongo();
    const message = await db.collection('CERISoNet').findOne({ _id: messageId });

    if (!message) {
      return res.status(404).json({ success: false, message: "Message non trouvé" });
    }

    const alreadyLiked = message.likedBy && message.likedBy.includes(userId);

    let update;
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

    const io = req.app.get('socketio');
    io.emit('message-liked', { messageId, liked: !alreadyLiked });

    res.json({ success: true, liked: !alreadyLiked });
  } catch (err) {
    console.error('Erreur dans likeMessage:', err);
    res.status(500).json({ success: false, message: 'Erreur lors du traitement du like' });
  }
};


shareMessage = async (req, res) => {
  const messageId = parseInt(req.params.id);
  const { userId } = req.body; // tu dois envoyer userId dans le body POST
  console.log("shareMessage.messageId reçu:", req.params.id); // pour like
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

    if (alreadyShared) {
      // Supprimer le message partagé
      await messagesCollection.deleteOne({ _id: alreadyShared._id });

      // Supprimer l'userId du tableau sharedBy du message original
      await messagesCollection.updateOne(
        { _id: messageId },
        { $pull: { sharedBy: userId } }
      );

      return res.json({ success: true, unshared: true });
    }

    // Créer le nouveau message partagé
    const now = new Date();
    const sharedMessage = {
      date: now.toISOString().split('T')[0],
      hour: now.toTimeString().split(' ')[0].substring(0, 5),
      body: originalMessage.body,
      createdBy: originalMessage.createdBy,
      images: originalMessage.images || null,
      likes: 0,
      likedBy: [],
      hashtags: originalMessage.hashtags || [],
      comments: [],
      shared: messageId, // référence vers le message original
      sharedBy: [], // pas besoin de remplissage ici, c’est pour d’éventuels futurs partages
    };

    const insertResult = await messagesCollection.insertOne(sharedMessage);

    // Ajouter userId au tableau sharedBy du message original
    await messagesCollection.updateOne(
      { _id: messageId },
      { $addToSet: { sharedBy: userId } }
    );

    const io = req.app.get('socketio');
    io.emit('message-shared', {
      originalMessageId: messageId,
      sharedBy: userId
    });

    res.status(201).json({ success: true, id: insertResult.insertedId, shared: true });
  } catch (err) {
    console.error('Erreur dans shareMessage:', err);
    res.status(500).json({ success: false, message: 'Erreur lors du partage du message' });
  }
};


getMessages = async (req, res) => {
  try {
    const db = await connectToMongo();
    const messages = await db.collection('CERISoNet').find().sort({ date: -1, hour: -1 }).toArray();

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

    res.json(messagesWithUsers);
  } catch (err) {
    console.error("Erreur dans getMessages:", err);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement des messages' });
  }
};

deleteComment = async (req, res) => {
  const messageId = parseInt(req.params.messageId);
  const commentId = req.params.commentId;
  const { userId } = req.body;
  console.log("deleteComment.messageId reçu:", req.params.id); // pour like
  console.log("deleteComment.userId reçu:", req.body);
  console.log("deleteComment.commentId reçu:", req.params.commentId);

  try {
    const db = await connectToMongo();
    const messagesCollection = db.collection('CERISoNet');

    // Vérifie si le commentaire appartient à l'utilisateur
    const message = await messagesCollection.findOne({
      _id: messageId,
      comments: {
        $elemMatch: {
          _id: commentId,
          'commentedBy.id': userId
        }
      }
    });

    console.log("message : ", message);
    if (!message) {
      return res.status(403).json({
        success: false,
        message: "Suppression interdite : commentaire non trouvé ou non autorisé"
      });
    }

    // Supprime le commentaire
    await messagesCollection.updateOne(
      { _id: messageId },
      { $pull: { comments: { _id: commentId } } }
    );

    res.json({ success: true, message: 'Commentaire supprimé' });
  } catch (err) {
    console.error("Erreur lors de la suppression du commentaire :", err);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression' });
  }
};

module.exports = { getMessages, shareMessage, likeMessage, addComment, postMessage, deleteComment }