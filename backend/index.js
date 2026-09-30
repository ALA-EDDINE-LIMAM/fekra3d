const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Sequelize } = require('sequelize');
const { sequelize } = require('./models');
const { MediaAsset } = require('./models');
const authMiddleware = require('./utils/auth');

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, 'uploads'));
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Replace spaces and weird chars
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

// File filter to validate extensions and basic MIME types
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.stl', '.obj', '.glb', '.3mf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Format de fichier non supporté. Seuls PNG, JPG, JPEG, WEBP, STL, OBJ, GLB et 3MF sont autorisés.'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Absolute max size: 50MB
  }
});

// Import routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const customRequestRoutes = require('./routes/customRequests');

const app = express();
app.set('trust proxy', 1);

// Restrict CORS origins while accepting both domain variants.
const normalizeOrigin = (value) => value?.trim().replace(/\/+$/, '');
const configuredFrontendOrigin = normalizeOrigin(process.env.FRONTEND_URL);
const allowedOrigins = [
  configuredFrontendOrigin,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

if (configuredFrontendOrigin) {
  try {
    const frontendUrl = new URL(configuredFrontendOrigin);
    const hostnameWithoutWww = frontendUrl.hostname.replace(/^www\./, '');
    allowedOrigins.push(
      `${frontendUrl.protocol}//${hostnameWithoutWww}`,
      `${frontendUrl.protocol}//www.${hostnameWithoutWww}`,
    );
  } catch {
    console.warn('FRONTEND_URL est invalide :', process.env.FRONTEND_URL);
  }
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(normalizeOrigin(origin)) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    } else {
      return callback(new Error('Accès bloqué par la politique CORS.'));
    }
  },
  credentials: true
}));

// Secure HTTP headers (with cross-origin policy allowed for static assets)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Rate Limiter to prevent DoS and brute force attacks (Relaxed in development)
const isProd = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 100 : 10000, // Relaxed limit for local development/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes effectuées depuis cette adresse IP. Veuillez réessayer plus tard.' }
});
app.use('/api/', limiter);

app.use(express.json());

app.get('/uploads/:filename', async (req, res, next) => {
  const requestedWidth = Number.parseInt(req.query.width, 10);
  const width = [320, 480, 640, 960, 1200].includes(requestedWidth) ? requestedWidth : null;

  if (!width) {
    return next();
  }

  const filename = path.basename(req.params.filename);
  const sourcePath = path.join(uploadsDir, filename);
  const cachedFilename = `${path.parse(filename).name}-w${width}.webp`;
  const cachedPath = path.join(uploadsDir, cachedFilename);

  if (!fs.existsSync(sourcePath)) {
    return next();
  }

  try {
    if (!fs.existsSync(cachedPath)) {
      await sharp(sourcePath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(cachedPath);
    }

    res.type('image/webp');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(cachedPath);
  } catch (error) {
    return next(error);
  }
});

// Uploaded filenames are unique, so browsers and CDNs can cache them safely.
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '7d',
  immutable: true,
}));

app.get('/api/media/:id', async (req, res, next) => {
  try {
    const media = await MediaAsset.findByPk(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Image introuvable.' });
    }

    res.type(media.mime_type);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(media.data);
  } catch (error) {
    return next(error);
  }
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/custom-requests', customRequestRoutes);

// Secure File upload endpoint with MIME type and size checks
app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier uploadé.' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
  const maxImageSize = 10 * 1024 * 1024; // 10MB for images
  const max3DSize = 50 * 1024 * 1024; // 50MB for 3D files

  if (isImage && req.file.size > maxImageSize) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({ error: 'Les images ne doivent pas dépasser 10 Mo.' });
  } else if (!isImage && req.file.size > max3DSize) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({ error: 'Les fichiers 3D ne doivent pas dépasser 50 Mo.' });
  }
  
  let filename = req.file.filename;

  if (isImage) {
    try {
      const compressedFilename = filename.replace(/\.[^/.]+$/, "") + ".webp";
      const compressedPath = path.join(req.file.destination, compressedFilename);
      
      // Read into buffer to avoid Windows file lock by sharp
      const fileBuffer = fs.readFileSync(req.file.path);
      
      await sharp(fileBuffer)
        .resize({ width: 1200, withoutEnlargement: true }) // Prevent too large images
        .webp({ quality: 80, effort: 4 })
        .toFile(compressedPath);
      
      // Delete original file
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Impossible de supprimer le fichier original:', unlinkErr);
      }
      
      filename = compressedFilename;
    } catch (err) {
      console.error("Erreur de compression d'image:", err);
      // Fallback to original filename if compression fails
    }
  }

  if (isImage) {
    try {
      const storedPath = path.join(req.file.destination, filename);
      const imageBuffer = fs.readFileSync(storedPath);
      const media = await MediaAsset.create({
        data: imageBuffer,
        mime_type: 'image/webp',
        original_name: req.file.originalname,
        size: imageBuffer.length,
      });

      try { fs.unlinkSync(storedPath); } catch (error) {
        console.warn('Impossible de supprimer le fichier image temporaire:', error.message);
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/api/media/${media.id}`;
      return res.json({ url: fileUrl });
    } catch (error) {
      console.error("Erreur d'enregistrement de l'image en base:", error);
      return res.status(500).json({ error: "Impossible d'enregistrer l'image en base de données." });
    }
  }

  // Dynamic host URL resolution (deployment ready)
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
  res.json({ url: fileUrl });
});

// Custom error handling middleware (for Multer and other errors)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux. Limite maximale de 50 Mo.' });
    }
    return res.status(400).json({ error: `Erreur d'upload: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Fekra 3D API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

const ensureOrderItemCustomizationColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDescription = await queryInterface.describeTable('OrderItems');

  if (!Object.prototype.hasOwnProperty.call(tableDescription, 'customization')) {
    await queryInterface.addColumn('OrderItems', 'customization', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '{}',
    });
  }
};

const initializeDatabase = async () => {
  await sequelize.sync();
  console.log('Database synced successfully');
  await ensureOrderItemCustomizationColumn();

  const { Category, AdminUser } = require('./models');
  const categories = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Porte clé' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Accessoire' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Pièces de rechange mécanique' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Figurines & Articulés' },
    { id: '55555555-5555-5555-5555-555555555555', name: 'Décoration & Maison' },
  ];
  for (const cat of categories) {
    await Category.findOrCreate({ where: { id: cat.id }, defaults: cat });
  }

  const primaryAdminEmail = (process.env.ADMIN_EMAIL || 'ahmed.espironza@gmail.com').trim();
  const primaryAdminUsername = (process.env.ADMIN_USERNAME || 'ahmed').trim();
  const primaryAdminPassword = (process.env.ADMIN_PASSWORD || 'fekra3d2026').trim();
  const existingAdmin = await AdminUser.findOne({
    where: {
      [Sequelize.Op.or]: [
        { email: primaryAdminEmail },
        { username: primaryAdminUsername }
      ]
    }
  });

  if (!existingAdmin) {
    await AdminUser.create({
      username: primaryAdminUsername,
      email: primaryAdminEmail,
      password: primaryAdminPassword,
      role: 'superadmin'
    });
    console.log(`[SEED] Initial Admin account created: ${primaryAdminEmail} (${primaryAdminUsername})`);
  }
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initializeDatabase().catch((error) => {
    console.error('Database initialization failed:', error.message);
  });
});
