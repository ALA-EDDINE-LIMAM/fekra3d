import { useEffect, useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { apiBaseUrl } from '../../services/api';
import { Download, AlertCircle, Phone, Mail, Clock, CheckCircle, HelpCircle } from 'lucide-react';

export default function AdminCustomRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`${apiBaseUrl}/api/custom-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Impossible de récupérer les requêtes.");
        return res.json();
      })
      .then(data => {
        setRequests(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${apiBaseUrl}/api/custom-requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
      } else {
        alert("Erreur de mise à jour.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle size={12} /> Complété</span>;
      case 'reviewed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><HelpCircle size={12} /> Analysé</span>;
      case 'contacted':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><Phone size={12} /> Client contacté</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20"><Clock size={12} /> En attente</span>;
    }
  };

  return (
    <AdminShell 
      title="Commandes Sur-Mesure" 
      description="Consultez et répondez aux demandes d'impression 3D personnalisées de vos clients."
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-400 border-r-2 border-r-transparent"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400">
          <AlertCircle size={24} />
          <div>
            <h3 className="font-semibold text-lg">Une erreur est survenue</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-[#1e293b]/10 border border-white/5 rounded-2xl">
          <p className="text-slate-400 font-medium">Aucune demande reçue pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-[#1e293b]/30 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{request.full_name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Reçu le {new Date(request.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(request.status)}
                  
                  <select 
                    value={request.status}
                    onChange={(e) => updateStatus(request.id, e.target.value)}
                    className="bg-[#07111d] text-white border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-emerald-500/50"
                  >
                    <option value="pending">Marquer en attente</option>
                    <option value="reviewed">Marquer comme analysé</option>
                    <option value="contacted">Marquer comme contacté</option>
                    <option value="completed">Marquer comme complété</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-[2fr_1fr] gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description & Options</h4>
                  <pre className="text-slate-200 text-sm font-sans whitespace-pre-wrap bg-black/30 p-4 rounded-xl border border-white/5">
                    {request.description}
                  </pre>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fichier Modèle</h4>
                    {request.file_url ? (
                      <a 
                        href={request.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl transition-all w-full justify-center"
                      >
                        <Download size={16} />
                        Télécharger le modèle 3D
                      </a>
                    ) : (
                      <div className="text-sm text-slate-500 italic bg-black/10 border border-white/5 p-3 rounded-xl text-center">
                        Aucun fichier attaché
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contacter</h4>
                    <div className="space-y-2">
                      <a 
                        href={`mailto:${request.email}`}
                        className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-emerald-400 transition-colors"
                      >
                        <Mail size={16} className="text-slate-400" />
                        {request.email}
                      </a>
                      <a 
                        href={`tel:${request.phone}`}
                        className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-emerald-400 transition-colors"
                      >
                        <Phone size={16} className="text-slate-400" />
                        {request.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
