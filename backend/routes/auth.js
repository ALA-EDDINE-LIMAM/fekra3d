const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Sequelize } = require('sequelize');
const { AdminUser } = require('../models');
const { sendPinCodeEmail } = require('../utils/email');
const authMiddleware = require('../utils/auth');

// In-memory store for pending PIN authentication challenges (challengeId -> challenge data)
const pinChallenges = new Map();

// Generate cryptographically secure 6-character uppercase alphanumeric security code (Numbers & Letters)
const generateSecurePinCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars (0, O, 1, I)
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
};

const PIN_EXPIRATION_MS = 60 * 1000; // 1 Minute (60 seconds)

// Helper to mask email address for privacy (e.g., ahmed.espironza@gmail.com -> a***a@gmail.com)
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return 'admin@***.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

// Clean expired challenges periodically
setInterval(() => {
  const now = Date.now();
  for (const [challengeId, challenge] of pinChallenges.entries()) {
    if (challenge.expiresAt < now) {
      pinChallenges.delete(challengeId);
    }
  }
}, 30 * 1000);

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
  }

  const queryTerm = String(username).trim();

  // 1. Search in database for matching AdminUser (by username or email)
  let admin = await AdminUser.findOne({
    where: {
      [Sequelize.Op.or]: [
        { username: queryTerm },
        { email: queryTerm.toLowerCase() }
      ]
    }
  });

  // 2. Fallback check for env credentials if database records do not match
  const envAdminUser = (process.env.ADMIN_USERNAME || 'ahmed').trim();
  const envAdminEmail = (process.env.ADMIN_EMAIL || 'ahmed.espironza@gmail.com').trim();
  const envAdminPass = (process.env.ADMIN_PASSWORD || 'fekra3d2026').trim();

  let adminUsername = '';
  let adminEmail = '';
  let isValidPassword = false;

  if (admin) {
    adminUsername = admin.username;
    adminEmail = admin.email;
    isValidPassword = String(password) === String(admin.password);
  } else if (queryTerm === envAdminUser || queryTerm.toLowerCase() === envAdminEmail.toLowerCase()) {
    adminUsername = envAdminUser;
    adminEmail = envAdminEmail;
    isValidPassword = String(password) === String(envAdminPass);
  }

  if (isValidPassword && adminEmail) {
    // Generate cryptographically secure 6-character alphanumeric PIN
    const pinCode = generateSecurePinCode();
    const challengeId = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + PIN_EXPIRATION_MS; // 1 minute validity

    pinChallenges.set(challengeId, {
      username: adminUsername,
      email: adminEmail,
      pin: pinCode,
      expiresAt,
      attempts: 0
    });

    // Send PIN code via email to this specific admin's email
    const emailResult = await sendPinCodeEmail(adminEmail, pinCode);

    if (emailResult === null) {
      console.warn(`[WARN] PIN Email sending failed. Demo PIN code for setup testing: ${pinCode}`);
    }

    return res.json({
      step: 'PIN_REQUIRED',
      challengeId,
      maskedEmail: maskEmail(adminEmail),
      expiresInSeconds: 60,
      message: `Un code de sécurité alphanumeric (6 caractères) a été envoyé à ${maskEmail(adminEmail)}. Il expire dans 1 minute.`
    });
  }

  return res.status(401).json({ error: 'Identifiants ou mot de passe incorrects.' });
});

router.post('/verify-pin', async (req, res) => {
  const { challengeId, pin } = req.body;
  const jwtSecret = (process.env.JWT_SECRET || 'fallback-secret-key').trim();

  if (!challengeId || !pin) {
    return res.status(400).json({ error: 'Identifiant de session ou code de sécurité manquant.' });
  }

  const challenge = pinChallenges.get(challengeId);

  if (!challenge) {
    return res.status(401).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
  }

  if (Date.now() > challenge.expiresAt) {
    pinChallenges.delete(challengeId);
    return res.status(401).json({ error: 'Code de sécurité expiré (valide 1 minute). Veuillez cliquer sur Renvoyer.' });
  }

  if (challenge.attempts >= 5) {
    pinChallenges.delete(challengeId);
    return res.status(429).json({ error: 'Trop de tentatives incorrectes. Session annulée.' });
  }

  if (challenge.pin.toUpperCase() !== String(pin).trim().toUpperCase()) {
    challenge.attempts += 1;
    return res.status(401).json({ error: 'Code de sécurité incorrect. Veuillez réessayer.' });
  }

  // PIN verified successfully! Issue signed JWT token
  pinChallenges.delete(challengeId);
  const token = jwt.sign({ username: challenge.username, email: challenge.email }, jwtSecret, { expiresIn: '24h' });

  return res.json({
    success: true,
    token,
    username: challenge.username,
    email: challenge.email
  });
});

router.post('/resend-pin', async (req, res) => {
  const { challengeId } = req.body;
  
  if (!challengeId) {
    return res.status(400).json({ error: 'Identifiant de session manquant.' });
  }

  const challenge = pinChallenges.get(challengeId);

  if (!challenge) {
    return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
  }

  // Generate a fresh alphanumeric security code & reset 60-second timer
  const newPinCode = generateSecurePinCode();
  challenge.pin = newPinCode;
  challenge.expiresAt = Date.now() + PIN_EXPIRATION_MS;
  challenge.attempts = 0;

  await sendPinCodeEmail(challenge.email, newPinCode);

  return res.json({
    expiresInSeconds: 60,
    message: `Nouveau code de sécurité (1 min) envoyé à ${maskEmail(challenge.email)}.`
  });
});


router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    res.json({ valid: true });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

// Admin Account Management Routes (Protected by JWT)
router.get('/admins', authMiddleware, async (req, res) => {
  try {
    const admins = await AdminUser.findAll({
      attributes: ['id', 'username', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des administrateurs.' });
  }
});

router.post('/admins', authMiddleware, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur, email et mot de passe sont requis.' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (!cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const existingUser = await AdminUser.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username: cleanUsername },
          { email: cleanEmail }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Un administrateur avec ce nom d\'utilisateur ou cet email existe déjà.' });
    }

    const newAdmin = await AdminUser.create({
      username: cleanUsername,
      email: cleanEmail,
      password: String(password).trim(),
      role: 'admin'
    });

    res.status(201).json({
      message: `Administrateur ${cleanEmail} créé avec succès.`,
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt
      }
    });
  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ error: 'Erreur lors de la création de l\'administrateur.' });
  }
});

router.delete('/admins/:id', authMiddleware, async (req, res) => {
  try {
    const count = await AdminUser.count();
    if (count <= 1) {
      return res.status(400).json({ error: 'Impossible de supprimer le dernier compte administrateur.' });
    }

    const admin = await AdminUser.findByPk(req.params.id);
    if (!admin) {
      return res.status(404).json({ error: 'Administrateur introuvable.' });
    }

    await admin.destroy();
    res.json({ message: 'Administrateur supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'administrateur.' });
  }
});

module.exports = router;


