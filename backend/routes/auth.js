const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const adminUser = (process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPass = (process.env.ADMIN_PASSWORD || 'fekra3d2026').trim();
  const jwtSecret = (process.env.JWT_SECRET || 'fallback-secret-key').trim();

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ username }, jwtSecret, { expiresIn: '24h' });
    return res.json({ token, username });
  }

  return res.status(401).json({ error: 'Identifiants incorrects.' });
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
