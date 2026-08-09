import { useEffect, useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { apiBaseUrl } from '../../services/api';
import { Download, Phone, Mail, Clock, CheckCircle, Package, AlertCircle } from 'lucide-react';

const parseCustomization = (customization) => {
  if (!customization) return { colors: [], material: '' };

  if (typeof customization === 'string') {
    try {
      return parseCustomization(JSON.parse(customization));
    } catch {
      return { colors: [], material: '' };
    }
  }

  return {
    colors: Array.isArray(customization.colors) ? customization.colors.filter(Boolean) : [],
    material: customization.material ? String(customization.material) : '',
  };
};

const describeCustomization = (customization) => {
  const parsed = parseCustomization(customization);
  const labels = [];

  if (parsed.colors.length > 0) {
    labels.push(`Couleur${parsed.colors.length > 1 ? 's' : ''}: ${parsed.colors.join(', ')}`);
  }

  if (parsed.material) {
    labels.push(`Matériau: ${parsed.material}`);
  }

  return labels;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`${apiBaseUrl}/api/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Accès non autorisé.");
        return res.json();
      })
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${apiBaseUrl}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert("Erreur lors de la mise à jour du statut.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  };

  const downloadInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Facture_${order.tracking_code}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .details h3 { margin-top: 0; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f8f8; }
            .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FEKRA 3D</div>
            <h2>Facture Client</h2>
          </div>
          
          <div class="details">
            <div>
              <h3>Informations de commande</h3>
              <p><strong>N° de Suivi:</strong> ${order.tracking_code}</p>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
              <p><strong>Statut:</strong> ${order.status === 'delivered' ? 'Livré' : order.status === 'processing' ? 'En cours' : 'En attente'}</p>
            </div>
            <div>
              <h3>Facturé à</h3>
              <p><strong>Nom:</strong> ${order.full_name}</p>
              <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
              <p><strong>Téléphone:</strong> ${order.phone}</p>
              <p><strong>Adresse:</strong> ${order.address}<br>${order.city}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix Unitaire</th>
                <th>Quantité</th>
                <th>Caractéristiques</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product_name || 'Produit inconnu'}</td>
                  <td>${Number(item.price).toFixed(3)} TND</td>
                  <td>${item.quantity}</td>
                  <td>${describeCustomization(item.customization).join('<br />') || '-'}</td>
                  <td>${(item.price * item.quantity).toFixed(3)} TND</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            Total à payer : ${order.total_price.toFixed(3)} TND
          </div>

          <div class="footer">
            Merci pour votre confiance. Fekra 3D - Impression 3D sur mesure.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'pending':
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <AdminShell title="Commandes" description="Visualisez et gérez le traitement des commandes de la boutique.">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-400 border-r-2 border-r-transparent"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400">
          <AlertCircle size={24} />
          <div>
            <h3 className="font-semibold text-lg">Erreur de chargement</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-[#1e293b]/10 border border-white/5 rounded-2xl">
          <p className="text-slate-400 font-medium">Aucune commande enregistrée pour le moment.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-white/10 rounded-2xl bg-[#1e293b]/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-slate-200 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Commande</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Articles</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white tracking-wider">
                      {order.tracking_code}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold">{order.full_name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone size={12} className="shrink-0" /> {order.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate">
                        {order.items?.map(item => `${item.product_name} (x${item.quantity})`).join(', ') || '0 articles'}
                      </div>
                      {order.items?.some(item => describeCustomization(item.customization).length > 0) ? (
                        <div className="mt-2 space-y-1 text-xs text-slate-400">
                          {order.items.map((item) => {
                            const labels = describeCustomization(item.customization);
                            if (!labels.length) return null;

                            return (
                              <div key={item.id}>
                                {item.product_name}: {labels.join(' · ')}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">
                      {order.total_price.toFixed(3)} TND
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status === 'delivered' ? 'Livré' : order.status === 'processing' ? 'En cours' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="bg-[#07111d] text-white border border-white/10 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500/50"
                      >
                        <option value="pending">En attente</option>
                        <option value="processing">En cours</option>
                        <option value="delivered">Livré</option>
                      </select>
                      <button 
                        onClick={() => downloadInvoice(order)}
                        className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border border-emerald-500/20 cursor-pointer"
                      >
                        <Download size={12} /> Facture
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
