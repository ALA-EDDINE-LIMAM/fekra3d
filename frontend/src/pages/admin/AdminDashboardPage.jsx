import { useEffect, useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { Download, Phone, Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiBaseUrl } from '../../services/api';

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

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`${apiBaseUrl}/api/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Accès refusé");
        return res.json();
      })
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch orders:', err);
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
    // Generate a printable HTML invoice that allows saving as PDF
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

  const totalRevenue = orders.reduce((acc, order) => acc + order.total_price, 0);

  const stats = [
    ['Commandes', orders.length],
    ['Revenus', `${totalRevenue.toFixed(2)} TND`],
    ['Produits Vendus', orders.reduce((acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity, 0), 0)],
  ];

  return (
    <AdminShell title="Dashboard" description="Résumé de l'activité et gestion des commandes.">
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</div>
            <div className="text-4xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white">Dernières Commandes</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-400">Chargement des commandes...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Aucune commande trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-black/20 text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Client & Contact</th>
                  <th className="px-6 py-4">Produits</th>
                  <th className="px-6 py-4 whitespace-nowrap">Prix Total</th>
                  <th className="px-6 py-4 whitespace-nowrap">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{order.full_name}</div>
                      <div className="text-slate-400 mt-1">{order.phone}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{order.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-3">
                        {order.items?.map((item) => {
                          const labels = describeCustomization(item.customization);
                          const content = (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0">
                                {item.product_image ? (
                                  <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600">?</div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-slate-200 font-medium line-clamp-1 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                  {item.product_name || 'Produit inconnu'}
                                  {item.product_id && <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                                <div className="text-slate-500 text-xs">
                                  {item.quantity} x {item.price} TND
                                </div>
                                {labels.length > 0 ? (
                                  <div className="text-[11px] text-slate-400 mt-1">
                                    {labels.join(' · ')}
                                  </div>
                                ) : null}
                              </div>
                            </>
                          );

                          return item.product_id ? (
                            <Link to={`/produit/${item.product_id}`} target="_blank" key={item.id} className="group flex items-center gap-3 hover:bg-white/5 p-1.5 -ml-1.5 rounded-lg transition-colors">
                              {content}
                            </Link>
                          ) : (
                            <div key={item.id} className="group flex items-center gap-3 p-1.5 -ml-1.5">
                              {content}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-emerald-400">{order.total_price} TND</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer outline-none transition-colors focus:ring-2 focus:ring-emerald-500/50 appearance-none pr-8 bg-no-repeat bg-right ${
                          order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          order.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundSize: '12px',
                          backgroundPosition: 'calc(100% - 10px) center'
                        }}
                      >
                        <option value="pending" className="bg-[#1e293b] text-white">En attente</option>
                        <option value="processing" className="bg-[#1e293b] text-white">En cours</option>
                        <option value="delivered" className="bg-[#1e293b] text-white">Livré</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.phone && (
                          <a 
                            href={`tel:${order.phone.replace(/[^0-9+]/g, '')}`}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors border border-emerald-500/20"
                            title="Appeler le client"
                          >
                            <Phone size={16} />
                          </a>
                        )}
                        {order.email && (
                          <a 
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${order.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors border border-blue-500/20"
                            title="Envoyer un email via Gmail"
                          >
                            <Mail size={16} />
                          </a>
                        )}

                        <button 
                          onClick={() => downloadInvoice(order)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10 ml-2"
                          title="Télécharger la facture"
                        >
                          <Download size={16} />
                          <span className="sr-only sm:not-sr-only text-xs font-medium">Facture</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
