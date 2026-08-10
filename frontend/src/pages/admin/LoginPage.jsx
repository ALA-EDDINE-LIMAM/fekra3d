import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiBaseUrl } from '../../services/api';
import { ADMIN_PATH } from '../../config/adminConfig';
import { Lock, User, AlertCircle, Loader2, KeyRound, ArrowLeft, RefreshCw, CheckCircle2, Timer, ShieldAlert, Mail, HelpCircle } from 'lucide-react';

export default function LoginPage() {
  // Step 1: Login Credentials, Step 2: Login PIN, Step 3: Forgot Password Request Email, Step 4: Forgot Password Reset PIN & New Password
  const [step, setStep] = useState(1); 
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [challengeId, setChallengeId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetPin, setResetPin] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status State
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // Countdown timer effect when in step 2 or step 4
  useEffect(() => {
    if (step !== 2 && step !== 4) return;
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Step 1: Submit Credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Identifiants incorrects');
      }

      if (data.step === 'PIN_REQUIRED') {
        setChallengeId(data.challengeId);
        setMaskedEmail(data.maskedEmail);
        setInfoMessage(data.message || `Un code de sécurité a été envoyé à ${data.maskedEmail}`);
        setTimeLeft(60);
        setStep(2);
      } else if (data.token) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', data.username);
        navigate(ADMIN_PATH);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit 2FA Login PIN
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const pinString = pin.join('').toUpperCase();
    if (pinString.length !== 6) {
      setError('Veuillez saisir les 6 caractères du code de sécurité.');
      return;
    }

    if (timeLeft <= 0) {
      setError('Le code de sécurité a expiré (valide 1 minute). Veuillez cliquer sur Renvoyer.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, pin: pinString })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Code de sécurité invalide.');
      }

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', data.username);
      navigate(ADMIN_PATH);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Request Forgot Password PIN
  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la demande de réinitialisation.');
      }

      setChallengeId(data.challengeId);
      setMaskedEmail(data.maskedEmail);
      setInfoMessage(`Code PIN envoyé à ${data.maskedEmail}. Entrez-le ci-dessous avec votre nouveau mot de passe.`);
      setTimeLeft(60);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Submit PIN & Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pinString = resetPin.join('').toUpperCase();
    if (pinString.length !== 6) {
      setError('Veuillez saisir le code PIN à 6 caractères reçu par email.');
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

    if (timeLeft <= 0) {
      setError('Le code PIN a expiré (1 min). Veuillez redemander un code.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          pin: pinString,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Échec de la réinitialisation du mot de passe.');
      }

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', data.username);
      navigate(ADMIN_PATH);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendPin = async () => {
    setResending(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/resend-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Impossible de renvoyer le code.');
      }

      setInfoMessage(data.message);
      if (step === 2) setPin(['', '', '', '', '', '']);
      if (step === 4) setResetPin(['', '', '', '', '', '']);
      setTimeLeft(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const handlePinInputChange = (pinArray, setPinArray, index, value, inputPrefix) => {
    const upperVal = value.toUpperCase();
    if (!/^[A-Z0-9]*$/.test(upperVal)) return;

    const newPin = [...pinArray];
    newPin[index] = upperVal.slice(-1);
    setPinArray(newPin);

    if (upperVal && index < 5) {
      const nextInput = document.getElementById(`${inputPrefix}-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (pinArray, index, e, inputPrefix) => {
    if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
      const prevInput = document.getElementById(`${inputPrefix}-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (setPinArray, e, inputPrefix) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().toUpperCase();
    if (/^[A-Z0-9]{6}$/.test(pastedData)) {
      setPinArray(pastedData.split(''));
      const lastInput = document.getElementById(`${inputPrefix}-5`);
      if (lastInput) lastInput.focus();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111d] px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 relative z-10 border border-white/10 rounded-3xl bg-slate-900/50 backdrop-blur-xl">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
            {step === 1 && <Lock size={24} />}
            {step === 2 && <KeyRound size={24} />}
            {step === 3 && <HelpCircle size={24} />}
            {step === 4 && <KeyRound size={24} className="text-amber-400" />}
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Espace Administration</h2>
          <p className="mt-3 text-sm text-slate-400">
            {step === 1 && 'Connectez-vous pour gérer la plateforme Fekra 3D.'}
            {step === 2 && `Code de sécurité 2FA envoyé à ${maskedEmail}`}
            {step === 3 && 'Réinitialisez votre mot de passe administrateur.'}
            {step === 4 && `Code PIN de réinitialisation envoyé à ${maskedEmail}`}
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Banner */}
        {infoMessage && (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 text-sm">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1: Login Form */}
        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleCredentialsSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="text-sm font-medium text-slate-300 block mb-2">Identifiant ou Email Admin</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder="ahmed.espironza@gmail.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-300 block">Mot de passe</label>
                  <button
                    type="button"
                    onClick={() => { setStep(3); setError(''); setInfoMessage(''); }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 px-4 text-slate-950 font-bold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#07111d] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Envoi du code...
                </>
              ) : (
                'Continuer'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: 2FA Login PIN Verification */}
        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handlePinSubmit}>
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  timeLeft > 15
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : timeLeft > 0
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {timeLeft > 0 ? (
                    <>
                      <Timer size={14} className="animate-spin" />
                      Code valide pendant : 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={14} />
                      Code expiré (1 min écoulée)
                    </>
                  )}
                </span>
              </div>

              <label className="text-sm font-medium text-slate-300 block text-center mb-4">
                Saisissez le code alphanumeric (Chiffres & Lettres) :
              </label>
              
              <div className="flex justify-center gap-2" onPaste={(e) => handlePaste(setPin, e, 'login-pin')}>
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`login-pin-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinInputChange(pin, setPin, idx, e.target.value, 'login-pin')}
                    onKeyDown={(e) => handleKeyDown(pin, idx, e, 'login-pin')}
                    className="w-11 h-13 text-center text-xl font-bold rounded-xl border border-white/15 bg-black/50 text-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all uppercase"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || pin.join('').length !== 6 || timeLeft <= 0}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 px-4 text-slate-950 font-bold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#07111d] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Valider le Code de Sécurité'}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setStep(1); setPin(['', '', '', '', '', '']); setError(''); }}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  Retour aux identifiants
                </button>

                <button
                  type="button"
                  onClick={handleResendPin}
                  disabled={resending}
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                  Renvoyer le code
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: Request Forgot Password PIN */}
        {step === 3 && (
          <form className="mt-8 space-y-6" onSubmit={handleRequestPasswordReset}>
            <div className="space-y-4">
              <div>
                <label htmlFor="resetEmail" className="text-sm font-medium text-slate-300 block mb-2">
                  Saisissez votre Adresse Email Administrateur
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder="ahmed.espironza@gmail.com"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Un code PIN 2FA sera immédiatement envoyé à cette adresse pour vous permettre de réinitialiser votre mot de passe.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 px-4 text-slate-950 font-bold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#07111d] disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Envoyer le Code PIN 2FA'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setInfoMessage(''); }}
                className="w-full flex items-center justify-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors py-1"
              >
                <ArrowLeft size={14} />
                Retour à la connexion
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Reset Password with 2FA PIN */}
        {step === 4 && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPasswordSubmit}>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  timeLeft > 15
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : timeLeft > 0
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {timeLeft > 0 ? (
                    <>
                      <Timer size={14} className="animate-spin" />
                      Code valide pendant : 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={14} />
                      Code expiré (1 min écoulée)
                    </>
                  )}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                  Code PIN de Sécurité (Reçu sur email)
                </label>
                <div className="flex justify-center gap-2" onPaste={(e) => handlePaste(setResetPin, e, 'reset-pin')}>
                  {resetPin.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`reset-pin-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinInputChange(resetPin, setResetPin, idx, e.target.value, 'reset-pin')}
                      onKeyDown={(e) => handleKeyDown(resetPin, idx, e, 'reset-pin')}
                      className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-white/15 bg-black/50 text-amber-400 focus:border-amber-400 outline-none transition-all uppercase"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Nouveau Mot de Passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-amber-400 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Confirmer le Nouveau Mot de Passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-amber-400 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || resetPin.join('').length !== 6 || timeLeft <= 0}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3.5 px-4 text-slate-950 font-bold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Réinitialiser & Se Connecter'}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setInfoMessage(''); }}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleResendPin}
                  disabled={resending}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                  Renvoyer le code
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
