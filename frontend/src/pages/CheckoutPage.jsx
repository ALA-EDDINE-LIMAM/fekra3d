import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useCart } from '../context/CartContext';
import { CheckCircle } from 'lucide-react';
import { apiBaseUrl } from '../services/api';

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

const isCustomizationComplete = (item) => {
  const product = item.product || {};
  const customization = item.customization || {};
  const requiredColors = Array.isArray(product.colors) ? product.colors.length > 0 : false;
  const requiredMaterials = Array.isArray(product.materials) ? product.materials.length > 0 : false;
  const requiredParts = Number(product.customizableParts) || 1;
  const selectedColors = Array.isArray(customization.colors) ? customization.colors.filter(Boolean) : [];

  const hasValidColors = !requiredColors || (selectedColors.length >= requiredParts && selectedColors.every((color) => (product.colors || []).includes(color)));
  const hasValidMaterial = !requiredMaterials || Boolean(customization.material);

  return hasValidColors && hasValidMaterial;
};

export default function CheckoutPage() {
  const { items: cartItems = [], totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    newsOptIn: false,
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    saveInfo: false,
    shippingMethod: 'home', // 'pickup' or 'home'
    billingSame: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [emailSent, setEmailSent] = useState(null);

  const shippingCost = formData.shippingMethod === 'home' ? 7.000 : 0.000;
  const finalTotal = totalPrice + shippingCost;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!cartItems.every(isCustomizationComplete)) {
      alert('Veuillez choisir la couleur et les caractéristiques disponibles pour chaque produit avant de valider la commande.');
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      full_name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone,
      email: formData.email,
      address: `${formData.address}${formData.postalCode ? `, ${formData.postalCode}` : ''}`,
      city: formData.city,
      total_price: finalTotal,
      shippingMethod: formData.shippingMethod,
      items: cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image_url || item.product.image || '',
        quantity: item.quantity,
        price: item.product.price,
        selected_colors: item.customization?.colors || [],
        selected_material: item.customization?.material || '',
        customization: item.customization || {
          colors: [],
          material: '',
          customizableParts: item.product?.customizableParts || 1,
        }
      }))
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        const data = await response.json();
        setTrackingCode(data.tracking_code || (data.order && data.order.tracking_code) || '');
        setEmailSent(Boolean(data.email_sent));
        setShowSuccess(true);
        clearCart();
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la création de la commande:', errorData);
        alert(`Erreur 400: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Commande Validée !</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg mb-6">
            Merci pour votre achat. Votre commande a bien été enregistrée. 
            Nous vous contacterons dans les plus brefs délais pour la confirmation et la livraison.
          </p>



          {trackingCode && (
            <div className="w-full max-w-md p-6 mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm space-y-4">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Votre code de suivi de commande
              </span>
              <div className="flex items-center justify-center gap-3 bg-slate-100 dark:bg-black/40 rounded-xl p-3 border border-slate-200 dark:border-white/10">
                <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white select-all">
                  {trackingCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(trackingCode);
                    alert('Code copié !');
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Copier
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conservez précieusement ce code. Vous pouvez l'utiliser à tout moment sur notre site pour suivre l'avancement de votre livraison.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
            {trackingCode && (
              <button 
                onClick={() => navigate(`/suivi?code=${encodeURIComponent(trackingCode)}`)}
                className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Suivre ma commande
              </button>
            )}
            <button 
              onClick={() => navigate('/')}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-6 py-3 font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Retourner à l'accueil
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Paiement" title="Confirmer votre commande" description="Terminez votre achat en remplissant vos informations.">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] pb-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Contact Section */}
          <div className="glass-panel p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Contact</h3>
              <span className="text-sm text-slate-500 hover:text-[#47d7c6] dark:text-slate-400 dark:hover:text-white cursor-pointer">Se connecter</span>
            </div>
            <div>
              <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none px-4 py-3 text-slate-900 dark:text-white transition-colors" placeholder="Adresse e-mail" />
            </div>
            <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" name="newsOptIn" checked={formData.newsOptIn} onChange={handleInputChange} className="w-4 h-4 rounded border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/40 text-emerald-500 focus:ring-emerald-500" />
              Envoyez-moi des nouvelles et des offres par e-mail
            </label>
          </div>

          {/* Livraison Section */}
          <div className="glass-panel p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Livraison</h3>
            <div>
              <select disabled className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-3 text-slate-900 dark:text-white appearance-none opacity-70">
                <option>Tunisie</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none px-4 py-3 text-slate-900 dark:text-white transition-colors" placeholder="Prénom (optionnel)" />
              <input required name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none px-4 py-3 text-slate-900 dark:text-white transition-colors" placeholder="Nom" />
            </div>
            <div>
              <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none px-4 py-3 text-slate-900 dark:text-white transition-colors" placeholder="Adresse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none px-4 py-3 text-slate-900 dark:text-white transition-colors" placeholder="Code postal (facultatif)" />
              <input required name="city" value={formData.city} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none px-4 py-3 text-slate-900 dark:text-white transition-colors" placeholder="Ville" />
            </div>
            <div>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none px-4 py-3 text-slate-900 dark:text-white transition-colors" placeholder="Téléphone" />
            </div>
            <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer pt-2">
              <input type="checkbox" name="saveInfo" checked={formData.saveInfo} onChange={handleInputChange} className="w-4 h-4 rounded border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/40 text-emerald-500 focus:ring-emerald-500" />
              Sauvegarder mes coordonnées pour la prochaine fois
            </label>
          </div>

          {/* Mode d'expédition Section */}
          <div className="glass-panel p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Mode d'expédition</h3>
            <div className="space-y-3">
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${formData.shippingMethod === 'pickup' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="shippingMethod" value="pickup" checked={formData.shippingMethod === 'pickup'} onChange={handleInputChange} className="w-4 h-4 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-slate-900 dark:text-white font-medium">Retrait magasin</span>
                    <a href="https://maps.app.goo.gl/DryuVUZxhdo1K9M4A" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-sm text-emerald-500 hover:underline mt-0.5">Position sur la carte</a>
                  </div>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Gratuit</span>
              </label>

              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${formData.shippingMethod === 'home_local' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="shippingMethod" value="home_local" checked={formData.shippingMethod === 'home_local'} onChange={handleInputChange} className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-900 dark:text-white font-medium">Livraison à Kélibia / Menzel Temim</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Gratuit</span>
              </label>
              
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${formData.shippingMethod === 'home' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="shippingMethod" value="home" checked={formData.shippingMethod === 'home'} onChange={handleInputChange} className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-900 dark:text-white font-medium">Livraison à domicile (Distance {'>'} 15km)</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">7,000 TND</span>
              </label>
            </div>
          </div>

          {/* Paiement Section */}
          <div className="glass-panel p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Paiement</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Toutes les transactions sont sécurisées et chiffrées.</p>
            
            <div className="border border-emerald-500 rounded-xl bg-emerald-500/5 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-slate-205 dark:border-white/10 bg-slate-100 dark:bg-black/20">
                <span className="text-slate-900 dark:text-white font-medium">Paiement à la livraison</span>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-black/40 text-center text-slate-700 dark:text-slate-300">
                Vous paierez le montant total à la livraison de votre commande.
              </div>
            </div>
          </div>

          {/* Adresse de facturation */}
          <div className="glass-panel p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Adresse de facturation</h3>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${formData.billingSame === true ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                <input type="radio" name="billingSame" checked={formData.billingSame === true} onChange={() => setFormData(prev => ({...prev, billingSame: true}))} className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-900 dark:text-white font-medium">Identique à l'adresse de livraison</span>
              </label>
              
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${formData.billingSame === false ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                <input type="radio" name="billingSame" checked={formData.billingSame === false} onChange={() => setFormData(prev => ({...prev, billingSame: false}))} className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-900 dark:text-white font-medium">Utiliser une adresse de facturation différente</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || cartItems.length === 0}
            className="w-full rounded-xl bg-emerald-500 px-5 py-4 font-bold text-slate-950 text-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Validation...' : 'Valider la commande'}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-white/10 pb-4">Résumé de la commande</h3>
            
            <div className="space-y-4 mb-6">
              {cartItems.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 overflow-hidden flex-shrink-0">
                    {(item.product?.image || item.product?.image_url) && <img src={item.product.image || item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />}
                    <span className="absolute -top-2 -right-2 bg-slate-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full z-10">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-slate-900 dark:text-white text-sm font-medium line-clamp-2">{item.product?.name}</h4>
                    {describeCustomization(item.customization).length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {describeCustomization(item.customization).map((label) => (
                          <span key={label} className="rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2 py-0.5">
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    {((item.product?.price || 0) * item.quantity).toFixed(3)} TND
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm border-t border-slate-200 dark:border-white/10 pt-4 mb-4">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Sous-total</span>
                <span className="text-slate-900 dark:text-white">{totalPrice.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Expédition</span>
                <span className="text-slate-900 dark:text-white">{shippingCost === 0 ? 'Gratuit' : `${shippingCost.toFixed(3)} TND`}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-4">
              <span className="text-lg text-slate-900 dark:text-white font-medium">Total</span>
              <div className="flex items-end gap-2">
                <span className="text-sm text-slate-400 mb-1">TND</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{finalTotal.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
