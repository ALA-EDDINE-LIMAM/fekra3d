import { useEffect, useMemo, useState } from 'react';
import { getProductMedia } from './productImages';
import { resolveMediaUrl } from '../services/api';

export const PRODUCTS_STORAGE_KEY = 'fekra3d-admin-products';

export const normalizeText = (text) => {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const tokenizeSearchText = (text) => normalizeText(text).split(/\s+/).filter(Boolean);

export const getProductSearchScore = (product, searchQuery = '', categoryQuery = '') => {
  const normalizedSearchQuery = normalizeText(searchQuery);
  const normalizedCategoryQuery = normalizeText(categoryQuery);
  const productName = normalizeText(product.name);
  const productCategory = normalizeText(product.category);

  if (normalizedCategoryQuery) {
    const categoryMatch = productCategory === normalizedCategoryQuery || productCategory.includes(normalizedCategoryQuery);
    if (!categoryMatch) {
      return 0;
    }
  }

  if (!normalizedSearchQuery) {
    return 1;
  }

  const terms = tokenizeSearchText(searchQuery);
  if (!terms.length) {
    return 1;
  }

  const matchedTerms = terms.filter((term) => productName.includes(term) || productCategory.includes(term));
  if (!matchedTerms.length) {
    return 0;
  }

  let score = matchedTerms.length * 12;

  if (productName.startsWith(normalizedSearchQuery) || productCategory.startsWith(normalizedSearchQuery)) {
    score += 60;
  }

  if (productName.includes(normalizedSearchQuery) || productCategory.includes(normalizedSearchQuery)) {
    score += 30;
  }

  if (matchedTerms.length === terms.length) {
    score += 20;
  }

  const nameMatches = terms.filter((term) => productName.includes(term)).length;
  const categoryMatches = terms.filter((term) => productCategory.includes(term)).length;

  if (nameMatches > 0 && categoryMatches > 0) {
    score += 15;
  }

  return score;
};

export const matchesProductSearch = (product, searchQuery = '', categoryQuery = '') => {
  return getProductSearchScore(product, searchQuery, categoryQuery) > 0;
};

const normalizeProduct = (product, index = 0) => {
  const images = Array.isArray(product.images)
    ? product.images.map(resolveMediaUrl).filter(Boolean)
    : [];
  const image = resolveMediaUrl(product.image ?? product.image_url ?? images[0] ?? '');
  const seededImage = image || resolveMediaUrl(getProductMedia(index).image);
  const category = product.category ?? product.Category?.name ?? product.categoryName ?? '';

  return {
    ...product,
    category,
    image: seededImage,
    images: images.length > 0 ? images : seededImage ? [seededImage] : [],
    features: Array.isArray(product.features) ? [...product.features] : [],
    price: Number(product.price) || 0,
    originalPrice: product.original_price ? Number(product.original_price) : null,
    model3d: product.model3d || '',
    colors: Array.isArray(product.colors) ? product.colors : [],
    materials: Array.isArray(product.materials) ? product.materials : [],
    dimensions: product.dimensions || '',
    weight: product.weight || '',
  };
};

const readStoredProducts = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const getProducts = () => {
  const storedProducts = readStoredProducts();
  return (storedProducts ?? products).map(normalizeProduct);
};

export const saveProducts = (nextProducts) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(nextProducts.map(normalizeProduct)));
    window.dispatchEvent(new Event('fekra3d-products-updated'));
  } catch (error) {
    console.error('Erreur de sauvegarde locale :', error);
    if (error.name === 'QuotaExceededError') {
      alert("⚠️ Erreur de Stockage (QuotaExceededError) : Le fichier 3D que vous essayez d'ajouter est trop volumineux pour être stocké directement dans le cache du navigateur (limite ~5Mo). \n\nVotre serveur Backend (localhost:5000) semble éteint (ERR_CONNECTION_REFUSED). Veuillez démarrer votre backend Node.js pour pouvoir uploader de gros fichiers, ou réduisez la taille du fichier.");
    } else {
      alert("Erreur lors de la sauvegarde du produit : " + error.message);
    }
    throw error;
  }
};

export const useProducts = () => {
  const [catalog, setCatalog] = useState(() => products.map(normalizeProduct));

  useEffect(() => {
    let mounted = true;
    const syncProducts = () => {
      if (!mounted) return;
      const storedProducts = readStoredProducts();
      setCatalog((storedProducts ?? products).map(normalizeProduct));
    };

    syncProducts();
    
    const fetchFromApi = async () => {
      try {
        const { fetchJson } = await import('../services/api');
        const data = await fetchJson('/api/products');
        if (mounted) {
          saveProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products from API:", error);
      }
    };
    
    fetchFromApi();

    const handleStorage = (event) => {
      if (event.key === PRODUCTS_STORAGE_KEY) {
        syncProducts();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('fekra3d-products-updated', syncProducts);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fekra3d-products-updated', syncProducts);
    };
  }, []);

  return catalog;
};

export const useProductById = (id) => {
  const catalog = useProducts();

  return useMemo(() => catalog.find((product) => product.id === id), [catalog, id]);
};

export const products = [
  {
    id: 'dragon-articule',
    name: 'Dragon Articulé Flexi',
    category: 'Figurines',
    price: 35,
    description:
      'Un dragon entièrement articulé, imprimé en 3D sans assemblage. Ses mouvements fluides en font un bon objet anti-stress ou une décoration unique.',
    ...getProductMedia(0),
    features: ['Articulé sur 45 points', 'Matériau: PLA Soie', 'Taille: 30 cm', 'Aucun assemblage requis'],
  },
  {
    id: 'vase-low-poly',
    name: 'Vase Low-Poly Géométrique',
    category: 'Décoration',
    price: 25,
    description:
      'Un vase au design géométrique minimaliste pensé pour les intérieurs modernes. Idéal pour fleurs séchées ou artificielles.',
    ...getProductMedia(1),
    features: ['Style minimaliste', 'Matériau: PETG', 'Hauteur: 20 cm', 'Finition texturée'],
  },
  {
    id: 'lampe-lune',
    name: 'Lampe Lune 3D Texturée',
    category: 'Éclairage',
    price: 55,
    description:
      'Une réplique de la lune avec texture détaillée et lumière douce intégrée pour une ambiance calme ou une veilleuse.',
    ...getProductMedia(2),
    features: ['Texture réaliste', 'LED blanc chaud', 'Diamètre: 15 cm', 'Alimentation USB'],
  },
  {
    id: 'support-casque-crane',
    name: 'Support Casque Crâne',
    category: 'Accessoires Bureau',
    price: 40,
    description:
      'Un support de casque audio en forme de crâne, parfait pour un setup gaming ou un bureau plus affirmé.',
    ...getProductMedia(3),
    features: ['Base stable', 'Matériau: PLA Matte', 'Compatible tous casques', 'Couleur noir ou blanc'],
  },
  {
    id: 'pot-plante-baby-groot',
    name: 'Pot de Plante Baby Groot',
    category: 'Décoration',
    price: 20,
    description:
      'Petit pot en forme de Baby Groot, adapté aux succulentes et cactus. Un trou de drainage est intégré au fond.',
    ...getProductMedia(4),
    features: ['Aspect bois', 'Drainage intégré', 'Hauteur: 12 cm', 'Idéal pour succulentes'],
  },
  {
    id: 'organisateur-bureau-hex',
    name: 'Organisateur Nid d\'Abeille',
    category: 'Accessoires Bureau',
    price: 18,
    description:
      'Système de rangement modulaire en forme d\'hexagones pour stylos, clés USB et petits accessoires.',
    ...getProductMedia(5),
    features: ['Design modulaire', '6 compartiments', 'Matériau: PLA recyclé', '15 x 15 cm'],
  },
  {
    id: 'lightbox-mario',
    name: 'Lightbox Super Mario',
    category: 'Éclairage',
    price: 35,
    description:
      'Une boîte lumineuse composée de plusieurs couches colorées créant un effet 3D magnifique avec le thème de Super Mario. Fonctionne sur USB.',
    ...getProductMedia(6),
    features: ['Éclairage LED intégré', 'Effet de profondeur (5 couches)', 'Dimensions: 20x20 cm', 'Câble USB inclus'],
  },
  {
    id: 'figurine-buste-batman',
    name: 'Buste de Batman HD',
    category: 'Figurines',
    price: 60,
    description:
      'Buste ultra-détaillé de Batman, imprimé en résine haute résolution. Parfait pour les collectionneurs et peintres de figurines.',
    ...getProductMedia(7),
    features: ['Impression Résine 8K', 'Prêt à peindre (Sous-couché)', 'Hauteur: 15 cm', 'Détails microscopiques'],
  },
].map(normalizeProduct);
