import { useEffect, useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { apiBaseUrl } from '../../services/api';
import { UserPlus, Trash2, ShieldCheck, Mail, User, Lock, AlertCircle, CheckCircle2, Loader2, Shield, KeyRound, Timer, ShieldAlert, RefreshCw, X } from 'lucide-react';

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // New Admin Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Password Change Modal State (2FA Protected)
  const [selectedAdminForReset, setSelectedAdminForReset] = useState(null); // admin object
  const [passChallengeId, setPassChallengeId] = useState('');
  const [passMaskedEmail, setPassMaskedEmail] = useState('');
  const [passPin, setPassPin] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passTimeLeft, setPassTimeLeft] = useState(60);
  const [passLoading, setPassLoading] = useState(false);

  // Notifications State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Timer for password change modal
  useEffect(() => {
    if (!selectedAdminForReset || passTimeLeft <= 0) return;
    const timer = setInterval(() => setPassTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [selectedAdminForReset, passTimeLeft]);

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

  // Open Password Change Modal & Request 2FA PIN for target Admin
  const handleOpenPasswordResetModal = async (targetAdmin) => {
    setError('');
    setSuccess('');
    setSelectedAdminForReset(targetAdmin);
    setPassPin(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setPassLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetAdmin.email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Impossible d\'envoyer le code PIN de sécurité.');
      }

      setPassChallengeId(data.challengeId);
      setPassMaskedEmail(data.maskedEmail);
      setPassTimeLeft(60);
      setSuccess(`Un code PIN 2FA a été envoyé à l'adresse ${data.maskedEmail}.`);
    } catch (err) {
      setError(err.message);
      setSelectedAdminForReset(null);
    } finally {
      setPassLoading(false);
    }
  };

  const handleConfirmPasswordResetModal = async (e) => {
    e.preventDefault();
    setError('');

    const pinString = passPin.join('').toUpperCase();
    if (pinString.length !== 6) {
      setError('Veuillez saisir le code PIN de 6 caractères reçu par email.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (passTimeLeft <= 0) {
      setError('Le code PIN a expiré (1 min). Cliquez sur Renvoyer un nouveau code.');
      return;
    }

    setPassLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: passChallengeId,
          pin: pinString,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Échec de la modification du mot de passe.');
      }

      setSuccess(`Le mot de passe de ${selectedAdminForReset.email} a été modifié avec succès !`);
      setSelectedAdminForReset(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const handleResendModalPin = async () => {
    if (!selectedAdminForReset) return;
    setPassLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedAdminForReset.email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Impossible de renvoyer le code PIN.');
      }

      setPassChallengeId(data.challengeId);
      setPassPin(['', '', '', '', '', '']);
      setPassTimeLeft(60);
      setSuccess(`Nouveau code PIN de sécurité envoyé à ${data.maskedEmail}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const handlePassPinChange = (index, value) => {
    const upper = value.toUpperCase();
    if (!/^[A-Z0-9]*$/.test(upper)) return;

    const newPin = [...passPin];
    newPin[index] = upper.slice(-1);
    setPassPin(newPin);

    if (upper && index < 5) {
      const nextInput = document.getElementById(`modal-pass-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <AdminShell 
      title="Gestion des Administrateurs & Sécurité" 
      description="Ajoutez, gérez et modifiez le mot de passe des comptes administrateurs de manière ultra-sécurisée avec validation 2FA par email."
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
          
          {/* Left Column: Form to Add New Admin */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6 sticky top-6">
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
                      Création...
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

          {/* Right / Main: Admin List Table with Password Change Action */}
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
                            <div className="flex items-center justify-end gap-2">
                              {/* Change Password Button */}
                              <button
                                onClick={() => handleOpenPasswordResetModal(admin)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-medium transition-colors cursor-pointer"
                                title="Changer le mot de passe (nécessite le code PIN email)"
                              >
                                <KeyRound size={14} />
                                Changer mot de passe
                              </button>

                              {/* Delete Admin Button */}
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
                            </div>
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

      {/* 2FA Password Reset Modal for Table Actions */}
      {selectedAdminForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedAdminForReset(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Changer le Mot de Passe</h3>
                <p className="text-xs text-slate-400">Compte : <span className="text-amber-400 font-semibold">{selectedAdminForReset.email}</span></p>
              </div>
            </div>

            <form onSubmit={handleConfirmPasswordResetModal} className="space-y-4">
              {/* Countdown badge */}
              <div className="flex justify-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  passTimeLeft > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {passTimeLeft > 0 ? (
                    <>
                      <Timer size={13} className="animate-spin" />
                      Code PIN valide : 00:{passTimeLeft < 10 ? `0${passTimeLeft}` : passTimeLeft}
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={13} />
                      Code PIN expiré (1 min)
                    </>
                  )}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                  Code PIN de Sécurité envoyé à {passMaskedEmail}
                </label>
                <div className="flex justify-center gap-1.5">
                  {passPin.map((char, idx) => (
                    <input
                      key={idx}
                      id={`modal-pass-pin-${idx}`}
                      type="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handlePassPinChange(idx, e.target.value)}
                      className="w-10 h-12 text-center font-bold text-lg rounded-xl border border-white/20 bg-black/60 text-amber-400 outline-none uppercase focus:border-amber-400"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Nouveau Mot de Passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-11 pr-4 text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Confirmer le Mot de Passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-11 pr-4 text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={passLoading || passTimeLeft <= 0 || passPin.join('').length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 px-4 text-slate-950 font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {passLoading ? <Loader2 size={18} className="animate-spin" /> : 'Changer le Mot de Passe'}
                </button>

                <button
                  type="button"
                  onClick={handleResendModalPin}
                  disabled={passLoading}
                  className="w-full text-xs text-amber-400 hover:underline flex items-center justify-center gap-1 py-1"
                >
                  <RefreshCw size={12} className={passLoading ? 'animate-spin' : ''} /> Renvoyer un nouveau code PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
