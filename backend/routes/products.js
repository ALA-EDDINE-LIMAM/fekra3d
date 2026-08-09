const express = require('express');
const router = express.Router();
const { Product, ProductVariant, Category } = require('../models');
const authMiddleware = require('../utils/auth');

const parseImages = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch (error) {
      return [value.trim()];
    }

    return [value.trim()];
  }

  return fallback;
};

const serializeProduct = (product) => {
  const plainProduct = product.get({ plain: true });
  const fallbackImages = plainProduct.image_url ? [plainProduct.image_url] : [];
  const images = parseImages(plainProduct.images, fallbackImages);
  const colors = parseImages(plainProduct.colors, []);
  const materials = parseImages(plainProduct.materials, []);

  return {
    ...plainProduct,
    images,
    colors,
    materials,
    image_url: plainProduct.image_url || images[0] || null,
  };
};

const buildProductData = (body, existingImages = []) => {
  const incomingImages = parseImages(body.images);
  const manualPrimaryImage = typeof body.image_url === 'string' ? body.image_url.trim() : '';
  const images = incomingImages.length > 0 ? incomingImages : existingImages;
  const primaryImage = manualPrimaryImage || images[0] || null;

  return {
    name: body.name?.trim(),
    description: body.description?.trim() ?? '',
    price: Number(body.price),
    original_price: body.original_price ? Number(body.original_price) : null,
    stock: Number.isFinite(Number(body.stock)) ? Number(body.stock) : 0,
    category_id: body.category_id || null,
    image_url: primaryImage,
    images: JSON.stringify(images.length > 0 ? images : primaryImage ? [primaryImage] : []),
    model3d: body.model3d || null,
    colors: JSON.stringify(Array.isArray(body.colors) ? body.colors : []),
    materials: JSON.stringify(Array.isArray(body.materials) ? body.materials : []),
    customizableParts: Number(body.customizableParts) || 1,
    dimensions: body.dimensions || null,
    weight: body.weight || null,
  };
};

// GET all products (catalogue)
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductVariant, as: 'variants' }
      ]
    });
    res.json(products.map(serializeProduct));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductVariant, as: 'variants' }
      ]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(serializeProduct(product));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new product (for Admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const productData = buildProductData(req.body);
    if (!productData.name || !Number.isFinite(productData.price)) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const product = await Product.create(productData, {
      include: [{ model: ProductVariant, as: 'variants' }]
    });

    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductVariant, as: 'variants' }
      ]
    });

    res.status(201).json(serializeProduct(createdProduct ?? product));
  } catch (error) {
    console.error('POST Error details:');
    console.error('req.body:', req.body);
    console.error('error message:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// PUT update product (for Admin)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existingImages = parseImages(product.getDataValue('images'), product.getDataValue('image_url') ? [product.getDataValue('image_url')] : []);
    const productData = buildProductData(req.body, existingImages);

    if (!productData.name || !Number.isFinite(productData.price)) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    await product.update(productData);

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductVariant, as: 'variants' }
      ]
    });

    res.json(serializeProduct(updatedProduct ?? product));
  } catch (error) {
    console.error('PUT Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE product (for Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
