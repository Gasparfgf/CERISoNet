// Import des modules nécessaires
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const express = require('express'); // Framework web pour Node.js
const { Pool } = require('pg');
const https = require('https'); // Module pour créer un serveur HTTPS
const path = require('path'); // Module pour gérer les chemins de fichiers
const cors = require('cors');
const fs = require('fs'); // Module pour lire les fichiers
const crypto = require('crypto');


const app = express(); // Création de l'application Express
const PORT = 3215; // Configuration du port d'écoute

// Configuration des certificats SSL pour HTTPS
const options = {
    key : fs.readFileSync('ssl_certs/key.pem'), // Clé privée SSL
    cert : fs.readFileSync('ssl_certs/cert.pem') // Certificat SSL
}

// Création du serveur HTTPS avec les options SSL
const httpsServer = https.createServer(options, app);


// Configuration PostgreSQL
const pool = new Pool({
    user: 'uapv2502991',
    host: 'localhost',
    database: 'etd',
    password: 'VRGCek',
    port: 5432,
});

// Configuration du store MongoDB pour les sessions
const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/MySession3215',
    collection: 'sessions'
});

// Servir les fichiers statiques Angular
const distPath = path.join(__dirname, 'frontend/dist/frontend/browser');
if (!fs.existsSync(distPath)) {
    console.error(`❌ Error: ${distPath} folder does not exist. Have you executed 'ng build' ?`);
    process.exit(1);
}

app.use(express.static(distPath));
app.use(cors({
    origin: ['http://localhost:3216', 'http://192.168.2.13:3216', 'https://pedago.univ-avignon.fr:3216',
        'https://pedago.univ-avignon.fr:3215', 'http://localhost:4200'
    ],
    methods: 'GET, POST',
    allowedHeaders: 'Content-Type',
    credentials: true
}));

const sessionSecret = crypto.randomBytes(32).toString('hex');
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Route principale - Sert le fichier index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'browser', 'index.html'));
});

// Route de login - Gestion de la connexion
app.post('/login', async (req, res) => {
    console.log("body", req.body);
    const { email, password } = req.body; // Extraction des paramètres de la requête
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    try {
        const result = await pool.query(
            'SELECT * FROM fredouil.compte WHERE mail = $1 AND motpasse = $2',
            [email, hashedPassword]
        );
        if (result.rows.length > 0) {
            req.session.user = {email};
            let date = new Date().toISOString();
            console.log(new Date(date));
            req.session.lastLogin = date;
            // Récupérer la dernière connexion stockée en session MongoDB
            let lastLogin = req.session.lastLogin || date;

            res.json({success: true, message: "Bienvenu(e) " + email, lastLogin: lastLogin});
            console.log("succeeded");
        } else {
            res.status(401).json({success: false, message: 'Identifiants incorrects'});
            console.log("not success");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Erreur serveur'});
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la déconnexion' });
        }
        res.json({ success: true, message: 'Déconnexion réussie' });
    });
});


// Démarrage du serveur HTTPS
httpsServer.listen(PORT, () => {
    console.log(`HTTPS server running on https://pedago.univ-avignon.fr:${PORT}/`);
});
