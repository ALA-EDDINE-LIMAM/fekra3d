import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Package, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const describeCustomization = (customization = {}) => {
  const labels = [];

  if (Array.isArray(customization.colors) && customization.colors.length > 0) {
    labels.push(`Couleur${customization.colors.length > 1 ? 's' : ''}: ${customization.colors.join(', ')}`);
  }

  if (customization.material) {
    labels.push(`Matériau: ${customization.material}`);
  }

  return labels;
};

export default function PanierPage() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="section-shell py-24 min-h-[70vh] flex flex-col justify-center">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-white/10">
            <ShoppingCart size={42} />
          </div>
          <h1 className="mb-6 text-4xl font-bold text-slate-900 dark:text-white">Votre panier est vide</h1>
          <p className="mb-8 text-slate-500 dark:text-slate-400">Découvrez notre catalogue et commencez à configurer votre commande.</p>
          <Link to="/catalogue" className="inline-flex items-center gap-2 rounded-xl bg-[#47d7c6] px-8 py-4 font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#47d7c6]/20">
            Parcourir le catalogue
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Panier</div>
            <h1 className="hero-title mt-3 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">Votre Panier</h1>
          </div>
          <Link to="/catalogue" className="inline-flex items-center gap-2 text-sm font-semibold text-[#47d7c6] hover:underline transition-all hover:gap-3">
            <ArrowLeft size={16} />
            Continuer vos achats
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] items-start">
          {/* Cart Items List */}
          <div className="flex flex-col gap-6">
            {items.map((item) => (
              <div key={item.id} className="glass-panel flex flex-col gap-5 rounded-[1.75rem] p-5 sm:flex-row sm:items-stretch shadow-sm hover:shadow-md transition-shadow relative">
                
                {/* Image Box */}
                <div className="aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-white dark:bg-[#0c1420] sm:w-36 border border-slate-200 dark:border-white/10 relative">
                  <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                </div>

                {/* Details */}
                <div className="flex w-full flex-col py-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                    <Link to={`/produit/${item.product.id}`} className="text-xl font-semibold text-slate-900 dark:text-white transition-colors hover:text-[#47d7c6] line-clamp-2">
                      {item.product.name}
                    </Link>
                    <p className="whitespace-nowrap text-lg font-bold text-slate-950 dark:text-[#47d7c6]">{(item.product.price * item.quantity).toFixed(3)} <span className="text-xs font-semibold">TND</span></p>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.product.category}</p>

                  {describeCustomization(item.customization).length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                      {describeCustomization(item.customization).map((label) => (
                        <span key={label} className="rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1 font-medium">
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-4">
                    {/* Quantity Selector */}
                    <div className="flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                      <button 
                        className="flex h-full w-11 items-center justify-center text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white" 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      >-</button>
                      <span className="w-10 text-center font-bold text-slate-900 dark:text-white text-sm">{item.quantity}</span>
                      <button 
                        className="flex h-full w-11 items-center justify-center text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white" 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >+</button>
                    </div>

                    {/* Remove Button */}
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 transition-colors hover:border-red-400/30 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Summary */}
          <div className="sticky top-24">
            <div className="glass-panel rounded-[1.75rem] p-6 sm:p-8 shadow-lg relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#47d7c6] rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-5 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                <Package size={18} className="text-[#47d7c6]" />
                Résumé
              </div>

              <div className="space-y-4 py-6 text-slate-600 dark:text-slate-300 font-medium text-[15px]">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="text-slate-900 dark:text-white font-bold">{totalPrice.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Livraison</span>
                  <span className="text-slate-400 text-xs">Calculé à l'étape suivante</span>
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-slate-200 dark:border-white/10 pt-6">
                <div>
                  <span className="block text-sm font-semibold text-slate-500 mb-1">Total TTC</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {totalPrice.toFixed(3)} <span className="text-xl font-bold text-[#47d7c6]">TND</span>
                  </span>
                </div>
              </div>

              <Link to="/checkout" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#47d7c6] hover:bg-[#3bc2b2] px-6 py-4 font-bold text-slate-950 transition-all hover:scale-[1.02] shadow-lg shadow-[#47d7c6]/20">
                Commander
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
