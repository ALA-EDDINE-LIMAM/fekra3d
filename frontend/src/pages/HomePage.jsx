import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, Sparkles, ShoppingCart, Eye, Paperclip } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../utils/products';
import { useCart } from '../context/CartContext';

export default function HomePage() {
  const products = useProducts();
  const showcaseProducts = products.slice(0, 8);
  const momentProducts = products.slice(0, 15);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!showcaseProducts.length) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % showcaseProducts.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [showcaseProducts.length]);

  const activeProduct = showcaseProducts[activeIndex];

  return (
    <div className="flex flex-col">
      <section className="relative w-full overflow-hidden py-10 lg:py-12 border-b border-slate-200 dark:border-white/10">
        {/* Original Background Restore */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_20%,rgba(71,215,198,0.04),transparent_30%),radial-gradient(circle_at_15%_25%,rgba(111,168,255,0.04),transparent_26%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row items-center justify-between w-full gap-2 md:gap-8">
            
            {/* Left Content (Text, Info & Buttons) */}
            <div className="w-[60%] md:w-1/2 lg:w-[40%] z-20 text-left">
              <div className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-teal-200/50 bg-teal-50 dark:border-emerald-400/25 dark:bg-emerald-400/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[7px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#0d9488] dark:text-[#47d7c6] mb-2 sm:mb-4">
                <Paperclip size={10} className="sm:w-3 sm:h-3" />
                Impression 3D
              </div>

              <h1 className="hero-title text-2xl sm:text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-1 sm:mb-2">
                fekra3D
              </h1>
              <h2 className="text-[8px] sm:text-xs md:text-base font-medium text-slate-650 dark:text-slate-300 mb-3 sm:mb-6 leading-relaxed max-w-md mx-0">
                Là où les bonnes idées prennent forme.
              </h2>
              
              {/* Contact Info */}
              <div className="flex flex-row items-center justify-start gap-1.5 sm:gap-3 mb-4 sm:mb-6 text-[7px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                 <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-950/50 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none whitespace-nowrap">
                    <span className="flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/20 text-[#0d9488] dark:text-[#47d7c6] text-[8px] sm:text-[10px] font-black">@</span>
                    <span>fekra3d.printing@gmail.com</span>
                 </div>
                 <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-950/50 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none whitespace-nowrap">
                    <span className="flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/20 text-[#0d9488] dark:text-[#47d7c6] text-[8px] sm:text-[10px] font-black">✆</span>
                    <span>+216 55 084 823</span>
                 </div>
              </div>

              <div className="flex flex-row gap-1 sm:gap-3 justify-start">
                <Link to="/catalogue" className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded-full bg-[#0d9488] px-2 sm:px-6 py-1.5 sm:py-2.5 text-[7px] sm:text-[11px] font-bold text-white transition-transform hover:-translate-y-0.5 shadow-[0_10px_25px_-5px_rgba(13,148,136,0.35)] whitespace-nowrap">
                  Voir les produits
                  <ArrowRight size={10} className="sm:w-3.5 sm:h-3.5" />
                </Link>
                <Link to="/suivi" className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded-full border border-slate-900 dark:border-slate-700 bg-transparent dark:bg-slate-950/50 px-2 sm:px-6 py-1.5 sm:py-2.5 text-[7px] sm:text-[11px] font-bold text-slate-900 dark:text-white transition-colors hover:bg-slate-900/5 dark:hover:bg-slate-900 whitespace-nowrap">
                  Suivre commande
                  <ChevronRight size={10} className="sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </div>

            {/* Center Content (Printer perfectly centered, shorter height) */}
            <div className="flex flex-1 justify-center items-center relative h-[140px] sm:h-[200px] md:h-[280px] z-10 px-0 sm:px-4">
               <div className="absolute inset-0 bg-[#47d7c6] rounded-full blur-[40px] sm:blur-[80px] opacity-10"></div>
               <img src="/printer.png" alt="Imprimante 3D" className="object-contain h-full w-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] relative z-10" />
            </div>

            {/* Right Content Area (Product Card) */}
            <div className="w-full lg:w-[25%] flex justify-end z-20 mt-6 lg:mt-0 hidden sm:flex">
               {activeProduct ? (
                 <div className="w-[220px] md:w-[240px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-2xl p-3">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 mb-2.5 relative border border-slate-200/50 dark:border-white/5 flex items-center justify-center">
                      <img 
                        key={`bg-${activeProduct.id}`}
                        src={activeProduct.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover blur-sm opacity-40 scale-110 pointer-events-none select-none transition-opacity duration-700 ease-in-out"
                      />
                      <img 
                        key={activeProduct.id}
                        src={activeProduct.image}
                        alt={activeProduct.name}
                        className="relative z-10 h-full w-full object-contain transition-opacity duration-700 ease-in-out"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Sélection</span>
                      <span className="rounded-full bg-slate-950 text-white dark:bg-[#47d7c6]/20 dark:text-[#47d7c6] px-2 py-0.5 text-[8px] font-bold">Vitrine</span>
                    </div>
                    
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1" title={activeProduct.name}>{activeProduct.name}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed line-clamp-2 min-h-[1.5rem]">
                      {activeProduct.description || "Découvrez nos créations."}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white">À partir de {activeProduct.price} TND</span>
                      
                      <div className="flex items-center gap-1">
                        {showcaseProducts.map((prod, index) => (
                          <button
                            key={prod.id}
                            onClick={() => setActiveIndex(index)}
                            className={`h-1 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-3 bg-[#47d7c6]' : 'w-1 bg-slate-300 dark:bg-slate-700'}`}
                            aria-label={`Voir ${prod.name}`}
                          />
                        ))}
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex w-[220px] md:w-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center shadow-2xl">
                    <div className="mb-3 rounded-full bg-white/5 p-3 text-slate-500">
                      <ShoppingCart size={24} />
                    </div>
                    <p className="text-xs text-slate-400">Le catalogue est actuellement vide. Ajoutez des produits !</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--background)] dark:bg-[#0b1118] pt-10 pb-16">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Produits</div>
              <h2 className="hero-title mt-2 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Les produits du moment</h2>
            </div>
            <Link to="/catalogue" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#47d7c6] transition-colors hover:text-[#74f0e1]">
              Voir tout
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {momentProducts.map((product) => {
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
        </div>
      </section>
    </div>
  );
}
