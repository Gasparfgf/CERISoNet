// Définit les routes

const express = require('express');
const { login, logout, getConnectedUsers } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/users/connected', getConnectedUsers);

module.exports = router;