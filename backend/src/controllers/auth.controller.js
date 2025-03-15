// Gestion de l'authentification

const { pool } = require('../utils/db.utils');
const { getLastLogin, updateLastLogin } = require('../utils/session.utils');
const crypto = require('crypto');

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    try {
        const result = await pool.query(
            'SELECT mail FROM fredouil.compte WHERE mail = $1 AND motpasse = $2',
            [email, hashedPassword]
        );

        if (result.rows.length > 0) {
            const lastLogin = await getLastLogin(email);
            await updateLastLogin(email);

            req.session.user = { email };
            res.json({ success: true, message: `Bienvenue ${email}`, lastLogin });
        } else {
            res.status(401).json({ success: false, message: 'Identifiants incorrects' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({success: false, message: 'Erreur lors de la déconnexion'});
        }
        res.json({success: true, message: 'Déconnexion réussie'});
    });
};


module.exports = { login, logout };