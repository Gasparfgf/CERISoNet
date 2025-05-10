// Gestion de l'authentification

const { pool } = require('../utils/db.utils');
const { getLastLogin, updateLastLogin } = require('../utils/session.utils');
const crypto = require('crypto');

const getConnectedUsers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, pseudo, avatar FROM fredouil.compte WHERE statut_connexion = 1'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs connectés' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
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
            const user = result.rows[0];
            const lastLogin = await getLastLogin(email);
            await updateLastLogin(email);

            await pool.query(
                'UPDATE fredouil.compte SET statut_connexion = 1 WHERE mail = $1',
                [email]
            );

            req.session.user = { email };
            res.json({
                success: true,
                message: `Bienvenue ${user.pseudo}`,
                lastLogin,
                user: {
                    id: user.id,
                    pseudo: user.pseudo,
                    avatar: user.avatar,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.mail
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Identifiants incorrects' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const logout = async (req, res) => {
    const userEmail = req.session.user?.email;

    try {
        if (userEmail) {
            await pool.query(
                'UPDATE fredouil.compte SET statut_connexion = 0 WHERE mail = $1',
                [userEmail]
            );
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Erreur destruction session', err);
                return res.status(500).json({ success: false, message: 'Erreur logout' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Déconnexion réussie' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur logout' });
    }
};


module.exports = { getConnectedUsers, login, logout };