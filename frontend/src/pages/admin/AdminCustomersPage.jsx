import { useEffect, useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { apiBaseUrl } from '../../services/api';
import { Mail, Phone, MapPin, AlertCircle, ShoppingBag, DollarSign } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
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
      .then(orders => {
        // Group orders by email or phone to form unique customer profiles
        const customerMap = {};

        orders.forEach(order => {
          const key = (order.email || order.phone || order.full_name).toLowerCase().trim();
          
          if (!customerMap[key]) {
            customerMap[key] = {
              name: order.full_name,
              email: order.email || 'Non renseigné',
              phone: order.phone,
              city: order.city,
              address: order.address,
              ordersCount: 0,
              totalSpent: 0,
              lastOrderDate: order.createdAt
            };
          }

          customerMap[key].ordersCount += 1;
          customerMap[key].totalSpent += order.total_price;
          
          if (new Date(order.createdAt) > new Date(customerMap[key].lastOrderDate)) {
            customerMap[key].lastOrderDate = order.createdAt;
          }
        });

        setCustomers(Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <AdminShell title="Clients" description="Consultez les fiches de vos clients et l'historique de leurs dépenses.">
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
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-[#1e293b]/10 border border-white/5 rounded-2xl">
          <p className="text-slate-400 font-medium">Aucun client enregistré pour le moment.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-white/10 rounded-2xl bg-[#1e293b]/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-slate-200 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nom Client</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Localisation</th>
                  <th className="px-6 py-4 text-center">Commandes</th>
                  <th className="px-6 py-4">Total Dépensé</th>
                  <th className="px-6 py-4">Dernière activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((customer, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {customer.email !== 'Non renseigné' && (
                        <a href={`mailto:${customer.email}`} className="text-slate-300 hover:text-emerald-400 flex items-center gap-2 text-xs transition-colors">
                          <Mail size={12} className="text-slate-500" /> {customer.email}
                        </a>
                      )}
                      <a href={`tel:${customer.phone}`} className="text-slate-300 hover:text-emerald-400 flex items-center gap-2 text-xs transition-colors">
                        <Phone size={12} className="text-slate-500" /> {customer.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 font-medium flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-500 shrink-0" />
                        {customer.city}
                      </div>
                      <div className="text-xs text-slate-500 max-w-[200px] truncate mt-0.5">{customer.address}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
                        <ShoppingBag size={10} /> {customer.ordersCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">
                      {customer.totalSpent.toFixed(3)} TND
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(customer.lastOrderDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
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
