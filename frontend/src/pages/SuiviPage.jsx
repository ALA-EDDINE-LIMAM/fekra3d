import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { Search, Package, Clock, CheckCircle } from 'lucide-react';
import { apiBaseUrl } from '../services/api';

export default function SuiviPage() {
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code');

  const [trackingCode, setTrackingCode] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async (code) => {
    if (!code || !code.trim()) return;
    
    setLoading(true);
    setError('');
    setOrderData(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/orders/track/${code.trim()}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Commande introuvable. Veuillez vérifier votre code.");
        }
        throw new Error("Erreur de serveur.");
      }
      const data = await response.json();
      setOrderData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeParam) {
      setTrackingCode(codeParam);
      fetchOrder(codeParam);
    }
  }, [codeParam]);

  const handleTrack = async (e) => {
    e.preventDefault();
    fetchOrder(trackingCode);
  };

  return (
    <PageShell 
      eyebrow="Suivi" 
      title="Suivre ma commande" 
      description="Entrez votre code de suivi reçu par email pour voir l'état d'avancement de votre commande."
    >
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4 mb-12">
          <input 
            type="text" 
            placeholder="Ex: CMD-1A2B3C" 
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all uppercase placeholder:normal-case"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search size={20} />
            {loading ? "Recherche..." : "Suivre"}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center">
            {error}
          </div>
        )}

        {orderData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Statut de la commande */}
            <div className="bg-white/80 dark:bg-[#1e293b]/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8 text-center">État de la commande</h2>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0 relative">
                {/* Ligne de progression (bureau seulement) */}
                <div className="hidden sm:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-slate-200 dark:bg-slate-800 -z-10 -translate-y-1/2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ 
                      width: orderData.status === 'delivered' ? '100%' : orderData.status === 'processing' ? '50%' : '0%' 
                    }} 
                  />
                </div>

                <div className={`flex flex-col items-center gap-3 ${['pending', 'processing', 'delivered'].includes(orderData.status) ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-[#0c1420] border-4 ${['pending', 'processing', 'delivered'].includes(orderData.status) ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-250 dark:border-slate-800'}`}>
                    <Clock size={24} />
                  </div>
                  <span className="font-semibold text-sm">En attente</span>
                </div>

                <div className={`flex flex-col items-center gap-3 ${['processing', 'delivered'].includes(orderData.status) ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-[#0c1420] border-4 ${['processing', 'delivered'].includes(orderData.status) ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-250 dark:border-slate-800'}`}>
                    <Package size={24} />
                  </div>
                  <span className="font-semibold text-sm">En cours de préparation</span>
                </div>

                <div className={`flex flex-col items-center gap-3 ${orderData.status === 'delivered' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-[#0c1420] border-4 ${orderData.status === 'delivered' ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-250 dark:border-slate-800'}`}>
                    <CheckCircle size={24} />
                  </div>
                  <span className="font-semibold text-sm">Livré</span>
                </div>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="bg-white/80 dark:bg-[#1e293b]/30 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-white/5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Détails de la commande</h3>
                <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">Passée le {new Date(orderData.createdAt).toLocaleDateString('fr-FR')} par {orderData.full_name}</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {orderData.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 overflow-hidden flex-shrink-0">
                        {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-slate-900 dark:text-white font-medium">{item.product_name || 'Produit'}</h4>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">Quantité: {item.quantity}</div>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {(item.price * item.quantity).toFixed(3)} TND
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-lg font-bold">
                  <span className="text-slate-900 dark:text-white">Total Payé</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{orderData.total_price.toFixed(3)} TND</span>
                </div>
              </div>
            </div>

            {/* Info Livraison */}
            <div className="bg-white/80 dark:bg-[#1e293b]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informations de livraison</h3>
              <p className="text-slate-700 dark:text-slate-300">{orderData.address}</p>
              <p className="text-slate-700 dark:text-slate-300">{orderData.city}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Téléphone : {orderData.phone}</p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
