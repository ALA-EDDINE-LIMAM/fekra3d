import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useProducts, getProductSearchScore } from '../utils/products';
import { useCart } from '../context/CartContext';

export default function CataloguePage() {
  const allProducts = useProducts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');

  const products = allProducts
    .map((product) => ({
      ...product,
      score: getProductSearchScore(product, searchParam, categoryParam),
    }))
    .filter((product) => product.score > 0)
    .sort((a, b) => b.score - a.score);

  const { addToCart } = useCart();

  const requiresConfiguration = (product) => (
    (Array.isArray(product.colors) && product.colors.length > 0) ||
    (Array.isArray(product.materials) && product.materials.length > 0) ||
    (Number(product.customizableParts) || 1) > 1
  );

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (requiresConfiguration(product)) {
      navigate(`/produit/${product.id}`);
      return;
    }

    addToCart(product, 1);
  };

  return (
    <PageShell
      eyebrow="Catalogue"
      title="Parcourir la bibliothèque de produits"
      description="Sélectionnez un modèle prêt à l'emploi ou passez à une demande sur mesure."
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => {
          const discount = product.originalPrice && product.originalPrice > product.price 
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
            : 0;
            
          return (
          <div key={product.id} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1420] shadow-sm hover:shadow-lg transition-shadow relative z-10 hover:z-20">
            <Link to={`/produit/${product.id}`} className="block relative w-full aspect-[4/3] bg-slate-950 overflow-hidden flex items-center justify-center">
              {discount > 0 && (
                <div className="absolute top-2 left-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-bold text-slate-900 shadow-md">
                  -{discount}%
                </div>
              )}
              <img 
                src={product.image} 
                alt="" 
                className="absolute inset-0 h-full w-full object-cover blur-sm opacity-40 scale-110 pointer-events-none select-none transition-transform duration-500 group-hover:scale-115" 
              />
              <img 
                src={product.image} 
                alt={product.name} 
                className="relative z-10 h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" 
              />
            </Link>
            
            <div className="flex flex-col flex-1 p-3 bg-white dark:bg-[#0c1420] z-10">
              <Link to={`/produit/${product.id}`} className="block mb-2 text-left">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors group-hover:text-[#47d7c6] line-clamp-2" title={product.name}>
                  {product.name}
                </h3>
              </Link>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[15px] font-bold text-slate-950 dark:text-[#47d7c6]">
                      {Number(product.price).toFixed(3)} <span className="text-xs">TND</span>
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-[11px] font-medium text-slate-400 line-through">
                        {Number(product.originalPrice).toFixed(3)} TND
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-[#47d7c6]/20 border border-slate-200/50 hover:border-[#47d7c6]/40 text-slate-800 hover:text-[#0d9488] transition-colors dark:bg-white/10 dark:border-transparent dark:text-white dark:hover:bg-[#47d7c6] dark:hover:text-slate-950"
                  onClick={(e) => handleAddToCart(e, product)}
                  title={requiresConfiguration(product) ? 'Configurer le produit' : 'Ajouter au panier'}
                >
                  <ShoppingCart size={16} fill="currentColor" />
                </button>
              </div>
            </div>
            
            {/* Espacement toujours présent, bouton visible uniquement au survol de la carte */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <Link to={`/produit/${product.id}`} className="flex w-full items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:text-[#47d7c6] dark:text-slate-400 dark:hover:text-[#47d7c6] transition-colors">
                   <Eye size={16} />
                   Voir
                 </Link>
            </div>
          </div>
        )})}
      </div>
    </PageShell>
  );
}
