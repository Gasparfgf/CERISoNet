// Définit les routes

const express = require('express');
const { login, logout } = require('../controllers/auth.controller');

const routes = express.Router();

routes.post('/login', login);
routes.post('/logout', logout);

module.exports = routes;
