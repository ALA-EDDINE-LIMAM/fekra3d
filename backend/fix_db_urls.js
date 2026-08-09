require('dotenv').config();
const models = require('./models');

async function fixUrls() {
  console.log("Fixing URLs in the database...");
  
  const products = await models.Product.findAll();
  for (const product of products) {
    let changed = false;
    
    if (product.image_url && product.image_url.includes('http://localhost:5000')) {
      product.image_url = product.image_url.replace('http://localhost:5000', '');
      changed = true;
    }
    
    if (product.images) {
      let imagesArr;
      try {
        imagesArr = JSON.parse(product.images);
      } catch (e) {
        // If it's not a JSON string, it might be a comma separated string or something else, but it's defined as TEXT default '[]'
        if (typeof product.images === 'string' && product.images.includes('http://localhost:5000')) {
          product.images = product.images.replace(/http:\/\/localhost:5000/g, '');
          changed = true;
        }
      }
      
      if (Array.isArray(imagesArr)) {
        const fixedArr = imagesArr.map(url => url.replace('http://localhost:5000', ''));
        product.images = JSON.stringify(fixedArr);
        changed = true;
      }
    }
    
    if (product.model3d && product.model3d.includes('http://localhost:5000')) {
      product.model3d = product.model3d.replace('http://localhost:5000', '');
      changed = true;
    }
    
    if (changed) {
      await product.save();
      console.log(`Updated product: ${product.name}`);
    }
  }
  
  console.log("Finished fixing URLs!");
}

fixUrls().then(() => process.exit(0)).catch(console.error);
