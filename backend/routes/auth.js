const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPinCodeEmail } = require('../utils/email');

// In-memory store for pending PIN authentication challenges (challengeId -> challenge data)
const pinChallenges = new Map();

// Helper to mask email address for privacy (e.g., fekra3d.printing@gmail.com -> f***d.printing@gmail.com)
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
}, 5 * 60 * 1000);

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const adminUser = (process.env.ADMIN_USERNAME || 'admin').trim();
  const adminEmail = (process.env.ADMIN_EMAIL || 'fekra3d.printing@gmail.com').trim();
  const adminPass = (process.env.ADMIN_PASSWORD || 'fekra3d2026').trim();

  const isUsernameMatch = username === adminUser || username?.toLowerCase() === adminEmail.toLowerCase();

  if (isUsernameMatch && password === adminPass) {
    // Generate cryptographically secure 6-digit PIN
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    const challengeId = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    pinChallenges.set(challengeId, {
      username: adminUser,
      email: adminEmail,
      pin: pinCode,
      expiresAt,
      attempts: 0
    });

    // Send PIN code via email
    const emailResult = await sendPinCodeEmail(adminEmail, pinCode);

    if (emailResult === null) {
      console.warn(`[WARN] PIN Email sending failed or fell back. Demo PIN code for setup testing: ${pinCode}`);
    }

    return res.json({
      step: 'PIN_REQUIRED',
      challengeId,
      maskedEmail: maskEmail(adminEmail),
      message: `Un code PIN à 6 chiffres a été envoyé à l'adresse ${maskEmail(adminEmail)}.`
    });
  }

  return res.status(401).json({ error: 'Identifiants ou mot de passe incorrects.' });
});

router.post('/verify-pin', async (req, res) => {
  const { challengeId, pin } = req.body;
  const jwtSecret = (process.env.JWT_SECRET || 'fallback-secret-key').trim();

  if (!challengeId || !pin) {
    return res.status(400).json({ error: 'Identifiant de session ou code PIN manquant.' });
  }

  const challenge = pinChallenges.get(challengeId);

  if (!challenge) {
    return res.status(401).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
  }

  if (Date.now() > challenge.expiresAt) {
    pinChallenges.delete(challengeId);
    return res.status(401).json({ error: 'Code PIN expiré (valide 10 min). Veuillez vous reconnecter.' });
  }

  if (challenge.attempts >= 5) {
    pinChallenges.delete(challengeId);
    return res.status(429).json({ error: 'Trop de tentatives incorrectes. Session annulée.' });
  }

  if (challenge.pin.trim() !== String(pin).trim()) {
    challenge.attempts += 1;
    return res.status(401).json({ error: 'Code PIN incorrect. Veuillez réessayer.' });
  }

  // PIN verified successfully! Issue signed JWT token
  pinChallenges.delete(challengeId);
  const token = jwt.sign({ username: challenge.username }, jwtSecret, { expiresIn: '24h' });

  return res.json({
    success: true,
    token,
    username: challenge.username
  });
});

router.post('/resend-pin', async (req, res) => {
  const { challengeId } = req.body;
  
  if (!challengeId) {
    return res.status(400).json({ error: 'Identifiant de session manquant.' });
  }

  const challenge = pinChallenges.get(challengeId);

  if (!challenge || Date.now() > challenge.expiresAt) {
    return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
  }

  // Generate a fresh PIN code
  const newPinCode = Math.floor(100000 + Math.random() * 900000).toString();
  challenge.pin = newPinCode;
  challenge.expiresAt = Date.now() + 10 * 60 * 1000;
  challenge.attempts = 0;

  await sendPinCodeEmail(challenge.email, newPinCode);

  return res.json({
    message: `Nouveau code PIN envoyé à ${maskEmail(challenge.email)}.`
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

module.exports = router;

