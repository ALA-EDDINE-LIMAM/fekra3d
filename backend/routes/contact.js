const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../utils/email');

// POST contact form submission
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Le nom, l\'email et le message sont obligatoires.' });
  }

  try {
    await sendContactEmail({ name, email, subject, message });
    res.json({ success: true, message: 'Votre message a bien été envoyé.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erreur lors de l\'envoi du message.' });
  }
});

module.exports = router;
