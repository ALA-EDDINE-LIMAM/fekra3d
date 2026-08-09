const { randomBytes } = require('crypto');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false }
});

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.FLOAT, allowNull: false },
  original_price: { type: DataTypes.FLOAT },
  image_url: { type: DataTypes.STRING },
  images: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  model3d: { type: DataTypes.STRING },
  colors: { type: DataTypes.TEXT, defaultValue: '[]' },
  materials: { type: DataTypes.TEXT, defaultValue: '[]' },
  customizableParts: { type: DataTypes.INTEGER, defaultValue: 1 },
  dimensions: { type: DataTypes.STRING },
  weight: { type: DataTypes.STRING }
});

const ProductVariant = sequelize.define('ProductVariant', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  color: { type: DataTypes.STRING },
  size: { type: DataTypes.STRING },
  material: { type: DataTypes.STRING },
  price_modifier: { type: DataTypes.FLOAT, defaultValue: 0 }
});

const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  full_name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  total_price: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'processing', 'delivered'), defaultValue: 'pending' },
  tracking_code: { type: DataTypes.STRING, unique: true }
});

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false }, // Price at the time of purchase
  product_name: { type: DataTypes.STRING },
  product_image: { type: DataTypes.STRING },
  product_id: { type: DataTypes.STRING }, // Relaxed to STRING without foreign key to allow mock products
  customization: { type: DataTypes.TEXT, defaultValue: '{}' }
});

const CustomRequest = sequelize.define('CustomRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  full_name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  file_url: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending', 'reviewed', 'contacted', 'completed'), defaultValue: 'pending' }
});

// Define Relationships
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

const generateTrackingCode = async () => {
  let trackingCode = '';

  do {
    trackingCode = `CMD-${randomBytes(4).toString('hex').toUpperCase()}`;
  } while (await Order.findOne({ where: { tracking_code: trackingCode } }));

  return trackingCode;
};

// Hook to generate a unique tracking code for each order
Order.beforeCreate(async (order) => {
  order.tracking_code = await generateTrackingCode();
});

module.exports = {
  sequelize,
  Category,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  CustomRequest
};
