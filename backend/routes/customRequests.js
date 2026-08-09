const express = require('express');
const router = express.Router();
const { CustomRequest } = require('../models');
const authMiddleware = require('../utils/auth');

// POST submit a new custom 3D printing request (Public)
router.post('/', async (req, res) => {
  const { full_name, email, phone, description, file_url } = req.body;

  if (!full_name || !email || !phone) {
    return res.status(400).json({ error: 'Le nom, l\'email et le téléphone sont obligatoires.' });
  }

  try {
    const customRequest = await CustomRequest.create({
      full_name,
      email,
      phone,
      description,
      file_url
    });

    res.status(201).json({ message: 'Demande soumise avec succès.', customRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all custom requests (Protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const requests = await CustomRequest.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update status of a custom request (Protected)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const customRequest = await CustomRequest.findByPk(req.params.id);
    if (!customRequest) return res.status(404).json({ message: 'Demande introuvable.' });

    customRequest.status = req.body.status;
    await customRequest.save();

    res.json(customRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
