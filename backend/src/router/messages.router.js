const express = require('express');
const controller = require('../controllers/messages.controller');

const router = express.Router();

router.post('/messages/:id/comments', controller.addComment);
router.post('/messages/:id/like', controller.likeMessage);
router.post('/messages/:id/share', controller.shareMessage);
router.get('/messages', controller.getMessages);
router.delete('/messages/:messageId/comments/:commentId', controller.deleteComment);

module.exports = router;
