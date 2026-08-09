const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Sequelize } = require('sequelize');
const { sequelize } = require('./models');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
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

// Restrict CORS origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
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

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/custom-requests', customRequestRoutes);

// Secure File upload endpoint with MIME type and size checks
app.post('/api/upload', upload.single('file'), (req, res) => {
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
  
  // Dynamic host URL resolution (deployment ready)
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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

// Database sync and server start
sequelize.sync()
  .then(async () => {
    console.log('Database synced successfully');
    await ensureOrderItemCustomizationColumn();
    
    // Seed categories
    const { Category } = require('./models');
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

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });
