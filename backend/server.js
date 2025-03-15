// Import des modules nécessaires
const session = require('express-session');
const express = require('express');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const { sessionStore } = require('./src/utils/db.utils');
const authRoutes = require('./src/router/routes');


const app = express();
const PORT = 3215;

// Configuration des certificats SSL pour HTTPS
const options = {
    key : fs.readFileSync('ssl_certs/key.pem'),
    cert : fs.readFileSync('ssl_certs/cert.pem')
}

// Création du serveur HTTPS avec les options SSL
const httpsServer = https.createServer(options, app);

const sessionSecret = crypto.randomBytes(32).toString('hex');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['http://localhost:3216', 'https://pedago.univ-avignon.fr:3216'],
    methods: 'GET, POST',
    allowedHeaders: 'Content-Type',
    credentials: true
}));
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}));
app.use('/', authRoutes);



// Servir les fichiers statiques Angular
const distPath = path.join(__dirname, '../frontend/dist/frontend/browser');
if (!fs.existsSync(distPath)) {
    console.error(`❌ Error: ${distPath} folder does not exist. Have you executed 'ng build' ?`);
    process.exit(1);
}
app.use(express.static(distPath));

// Route principale - Sert le fichier index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});


// Lancement du serveur HTTPS
httpsServer.listen(PORT, () => {
    console.log(`HTTPS server running on https://pedago.univ-avignon.fr:${PORT}/`);
});
