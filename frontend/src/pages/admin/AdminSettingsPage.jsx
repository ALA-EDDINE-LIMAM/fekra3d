import { useEffect, useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { apiBaseUrl } from '../../services/api';
import { UserPlus, Trash2, ShieldCheck, Mail, User, Lock, AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // New Admin Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Notifications State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${apiBaseUrl}/api/auth/admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Impossible de charger la liste des administrateurs.');
      }

      const data = await response.json();
      setAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${apiBaseUrl}/api/auth/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de l\'administrateur.');
      }

      setSuccess(`Administrateur ${data.admin.email} ajouté avec succès !`);
      setUsername('');
      setEmail('');
      setPassword('');
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur ${adminEmail} ?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setDeletingId(adminId);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${apiBaseUrl}/api/auth/admins/${adminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Impossible de supprimer cet administrateur.');
      }

      setSuccess(`Administrateur ${adminEmail} supprimé avec succès.`);
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminShell 
      title="Gestion des Administrateurs" 
      description="Ajoutez ou supprimez des comptes administrateurs. Chaque admin reçoit son code PIN 2FA par email."
    >
      <div className="space-y-8">

        {/* Global Notifications */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm animate-shake">
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 text-sm">
            <CheckCircle2 size={20} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Left / Top: Add New Admin Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Ajouter un Admin</h2>
                  <p className="text-xs text-slate-400">Créez un nouvel accès administrateur</p>
                </div>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Nom d'utilisateur
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ex: ahmed"
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Adresse Email (Reçoit le PIN)
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ahmed.espironza@gmail.com"
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 px-4 text-slate-950 font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Créer l'Administrateur
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right / Main: Admin List Table */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={22} className="text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Comptes Administrateurs</h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {admins.length} Administrateur{admins.length > 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-emerald-400" />
                  <span>Chargement de la liste des administrateurs...</span>
                </div>
              ) : admins.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  Aucun compte administrateur enregistré dans la base de données.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-black/20 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-4">Utilisateur</th>
                        <th className="px-6 py-4">Email (Récipiendaire PIN)</th>
                        <th className="px-6 py-4">Rôle</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {admins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                                {admin.username?.[0]?.toUpperCase() || 'A'}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{admin.username}</div>
                                <div className="text-[11px] text-slate-500">Créé le {new Date(admin.createdAt).toLocaleDateString('fr-FR')}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-slate-300 font-medium">
                              <Mail size={15} className="text-slate-500" />
                              <span>{admin.email}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                              admin.role === 'superadmin' 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              <Shield size={12} />
                              {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                              disabled={deletingId === admin.id || admins.length <= 1}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={admins.length <= 1 ? 'Impossible de supprimer le dernier administrateur' : 'Supprimer cet administrateur'}
                            >
                              {deletingId === admin.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AdminShell>
  );
}
