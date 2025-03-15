// Gestion des sessions dans MongoDB

const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb://localhost:27017';
const dbName = 'MySession3215';
const collectionName = 'sessions';

const client = new MongoClient(mongoUri);
client.connect();

const db = client.db(dbName);
const sessionCollection = db.collection(collectionName);

async function getLastLogin(email) {
    const userSession = await sessionCollection.findOne({ email });
    return userSession ? userSession.lastLogin : null;
}

async function updateLastLogin(email) {
    const currentDate = new Date().toISOString();
    await sessionCollection.updateOne(
        { email },
        { $set: { lastLogin: currentDate } },
        { upsert: true }
    );
}

module.exports = { getLastLogin, updateLastLogin };
