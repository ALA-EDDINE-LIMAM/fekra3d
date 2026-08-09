require('dotenv').config();
const { Sequelize } = require('sequelize');
const models = require('./models');

const sqlite = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function migrate() {
  console.log("🚀 Starting database migration from SQLite to Supabase...");
  
  try {
    // 1. Sync Supabase to make sure tables exist
    console.log("Syncing Supabase schema...");
    await models.sequelize.sync({ force: false, alter: true });
    
    // 2. Fetch data from SQLite
    console.log("Reading data from local SQLite database...");
    const [categories] = await sqlite.query("SELECT * FROM Categories");
    const [products] = await sqlite.query("SELECT * FROM Products");
    const [variants] = await sqlite.query("SELECT * FROM ProductVariants");
    const [orders] = await sqlite.query("SELECT * FROM Orders");
    const [items] = await sqlite.query("SELECT * FROM OrderItems");
    const [requests] = await sqlite.query("SELECT * FROM CustomRequests");
    
    console.log(`Found: ${categories.length} categories, ${products.length} products, ${orders.length} orders.`);
    
    // 3. Insert into Supabase (ignoring duplicates if any)
    console.log("Uploading data to Supabase...");
    
    if (categories.length > 0) await models.Category.bulkCreate(categories, { ignoreDuplicates: true });
    if (products.length > 0) await models.Product.bulkCreate(products, { ignoreDuplicates: true });
    if (variants.length > 0) await models.ProductVariant.bulkCreate(variants, { ignoreDuplicates: true });
    if (orders.length > 0) await models.Order.bulkCreate(orders, { ignoreDuplicates: true });
    if (items.length > 0) await models.OrderItem.bulkCreate(items, { ignoreDuplicates: true });
    if (requests.length > 0) await models.CustomRequest.bulkCreate(requests, { ignoreDuplicates: true });
    
    console.log("✅ Migration complete! Your Supabase database now has all your data.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
}

migrate().then(() => process.exit(0));
