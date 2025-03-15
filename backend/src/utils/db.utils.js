// Centralise la connexion à PostgreSQL et MongoDB.
const { Pool } = require('pg');
const session = require("express-session");
const MongoDBStore = require('connect-mongodb-session')(session);


// Configuration PostgreSQL
const pool = new Pool({
    user: 'uapv2502991',
    host: 'localhost',
    database: 'etd',
    password: 'VRGCek',
    port: 5432,
});

// Configuration du store MongoDB pour les sessions
const sessionStore = new MongoDBStore({
    uri: 'mongodb://localhost:27017/MySession3215',
    collection: 'sessions'
});

module.exports = { pool, sessionStore };