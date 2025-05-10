// Centralise la connexion à PostgreSQL et MongoDB.
const { Pool } = require('pg');
const { MongoClient, ObjectId } = require('mongodb');
const session = require("express-session");
const MongoDBStore = require('connect-mongodb-session')(session);


const uri = "mongodb://localhost:27017";
let db;

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
    uri: uri+'/MySession3215',
    collection: 'sessions'
});

// Connexion MongoDB
async function connectToMongo() {
    if (db) return db;
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db("db-CERI");
    return db;
}

module.exports = { pool, sessionStore, connectToMongo, ObjectId };