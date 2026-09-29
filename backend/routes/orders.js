const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product } = require('../models');
const { sendOrderConfirmationEmail } = require('../utils/email');
const authMiddleware = require('../utils/auth');

const parseJson = (value, fallback) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry && typeof entry === 'object' ? entry : String(entry).trim()))
      .filter((entry) => (typeof entry === 'object' ? true : Boolean(entry)));
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => (entry && typeof entry === 'object' ? entry : String(entry).trim()))
          .filter((entry) => (typeof entry === 'object' ? true : Boolean(entry)));
      }
    } catch {
      return [value.trim()];
    }
  }

  return fallback;
};

const COLOR_NAMES = {
  '#000000': 'Noir',
  '#ffffff': 'Blanc',
  '#ff0000': 'Rouge',
  '#00ff00': 'Vert',
  '#0000ff': 'Bleu',
  '#ffff00': 'Jaune',
  '#ffa500': 'Orange',
  '#800080': 'Violet',
  '#808080': 'Gris',
  '#ffc0cb': 'Rose',
  '#a52a2a': 'Marron',
};

const parseProductColors = (value) => parseJson(value, []).map((color) => {
  if (color && typeof color === 'object') {
    return { name: String(color.name ?? color.label ?? color.value ?? '').trim(), value: String(color.value ?? color.color ?? color.name ?? '').trim() };
  }

  const rawColor = String(color).trim();
  const separatorIndex = rawColor.indexOf('|');
  return separatorIndex > 0
    ? { name: rawColor.slice(0, separatorIndex).trim(), value: rawColor.slice(separatorIndex + 1).trim() }
    : { name: COLOR_NAMES[rawColor.toLowerCase()] ?? rawColor, value: rawColor };
});

const parseCustomization = (value = {}) => {
  if (typeof value === 'string') {
    try {
      return parseCustomization(JSON.parse(value));
    } catch {
      return { colors: [], material: '', customizableParts: 1 };
    }
  }

  const colors = parseJson(value.colors ?? value.selected_colors, []);
  const material = value.material ?? value.selected_material ?? '';
  const customizableParts = Number(value.customizableParts ?? value.customizable_parts) || colors.length || 1;

  return {
    colors,
    material: String(material).trim(),
    customizableParts,
  };
};

const serializeOrderItem = (item) => {
  const plainItem = item.get ? item.get({ plain: true }) : item;
  return {
    ...plainItem,
    customization: parseCustomization(plainItem.customization),
  };
};

const serializeOrder = (order) => {
  const plainOrder = order.get ? order.get({ plain: true }) : order;
  return {
    ...plainOrder,
    items: Array.isArray(plainOrder.items) ? plainOrder.items.map(serializeOrderItem) : [],
  };
};

// POST create a new order (Guest Checkout)
router.post('/', async (req, res) => {
  const { full_name, phone, email, address, city, items, shippingMethod } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Le panier est vide.' });
  }

  try {
    let computedTotalPrice = 0;
    const validatedItems = [];

    for (const item of items) {
      // Find product in DB to get the correct price
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        return res.status(400).json({ error: `Produit introuvable : ${item.product_name || item.product_id}` });
      }

      const availableColors = parseProductColors(product.colors);
      const availableMaterials = parseJson(product.materials, []);
      const customizableParts = Number(product.customizableParts) || 1;
      const customization = parseCustomization(item.customization ?? {
        colors: item.selected_colors,
        material: item.selected_material,
      });

      if (availableColors.length > 0) {
        const missingColors = customization.colors.length < customizableParts || customization.colors.some((color) => !color);
        const invalidColors = customization.colors.some((color) => !availableColors.some((availableColor) => availableColor.name === color));

        if (missingColors || invalidColors) {
          return res.status(400).json({
            error: `La couleur est obligatoire pour le produit ${product.name}.`,
          });
        }
      }

      if (availableMaterials.length > 0) {
        if (!customization.material) {
          return res.status(400).json({
            error: `Le matériau est obligatoire pour le produit ${product.name}.`,
          });
        }

        if (!availableMaterials.includes(customization.material)) {
          return res.status(400).json({
            error: `Le matériau choisi pour ${product.name} est invalide.`,
          });
        }
      }

      const price = product.price;
      const quantity = parseInt(item.quantity, 10) || 1;
      computedTotalPrice += price * quantity;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        price: price,
        quantity: quantity,
        customization: JSON.stringify(customization)
      });
    }

    // Add shipping cost (home delivery is 7.000 TND, pickup is 0 TND)
    const shippingCost = shippingMethod === 'home' ? 7.000 : 0.000;
    computedTotalPrice += shippingCost;

    // Create the order with secured server-side calculations
    const order = await Order.create({
      full_name,
      phone,
      email,
      address,
      city,
      total_price: computedTotalPrice,
      items: validatedItems
    }, {
      include: [{ model: OrderItem, as: 'items' }]
    });
    
    let emailSent = false;

    // On tente l'envoi avant de répondre, mais l'échec SMTP ne bloque pas la commande.
    if (order.email) {
      const emailInfo = await sendOrderConfirmationEmail(serializeOrder(order));
      emailSent = Boolean(emailInfo);
    }

    res.status(201).json({
      message: 'Order created successfully',
      tracking_code: order.tracking_code,
      email_sent: emailSent,
      order: serializeOrder(order)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET track order by tracking code (Public)
router.get('/track/:code', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { tracking_code: req.params.code },
      include: [{
        model: OrderItem,
        as: 'items'
      }]
    });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(serializeOrder(order));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all orders for admin (Protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      include: [{
        model: OrderItem,
        as: 'items'
      }]
    });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update order status (Protected)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.status = req.body.status;
    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
