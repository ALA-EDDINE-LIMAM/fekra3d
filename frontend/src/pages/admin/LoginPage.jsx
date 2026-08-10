import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiBaseUrl } from '../../services/api';
import { ADMIN_PATH } from '../../config/adminConfig';
import { Lock, User, AlertCircle, Loader2, KeyRound, ArrowLeft, RefreshCw, CheckCircle2, Timer, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); // 1 = Credentials, 2 = 6-Character Alphanumeric Security Code
  const [challengeId, setChallengeId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds countdown
  const navigate = useNavigate();

  // Countdown timer effect when in step 2
  useEffect(() => {
    if (step !== 2) return;

    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

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
        setTimeLeft(60); // Start 60s countdown
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

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const pinString = pin.join('').toUpperCase();
    if (pinString.length !== 6) {
      setError('Veuillez saisir les 6 caractères du code de sécurité.');
      return;
    }

    if (timeLeft <= 0) {
      setError('Le code de sécurité a expiré (valide 1 minute). Veuillez demander un nouveau code.');
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
      setPin(['', '', '', '', '', '']);
      setTimeLeft(60); // Reset 60s countdown
      const firstInput = document.getElementById('pin-0');
      if (firstInput) firstInput.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const handlePinChange = (index, value) => {
    // Allow uppercase letters and numbers (A-Z, 0-9)
    const upperVal = value.toUpperCase();
    if (!/^[A-Z0-9]*$/.test(upperVal)) return;

    const newPin = [...pin];
    newPin[index] = upperVal.slice(-1);
    setPin(newPin);

    // Auto-advance to next input box
    if (upperVal && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().toUpperCase();
    if (/^[A-Z0-9]{6}$/.test(pastedData)) {
      const chars = pastedData.split('');
      setPin(chars);
      const lastInput = document.getElementById('pin-5');
      if (lastInput) lastInput.focus();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111d] px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 relative z-10 border border-white/10 rounded-3xl bg-slate-900/50 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
            {step === 1 ? <Lock size={24} /> : <KeyRound size={24} />}
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Espace Administration</h2>
          <p className="mt-3 text-sm text-slate-400">
            {step === 1 
              ? 'Connectez-vous pour gérer la plateforme Fekra 3D.' 
              : `Code de sécurité 2FA envoyé à ${maskedEmail}`}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 text-sm">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {step === 1 ? (
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
                <label htmlFor="password" className="text-sm font-medium text-slate-300 block mb-2">Mot de passe</label>
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
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handlePinSubmit}>
            <div>
              {/* Countdown Timer Badge */}
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
              
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`pin-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
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
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Vérification du Code...
                  </>
                ) : (
                  'Valider le Code de Sécurité'
                )}
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
                  Renvoyer un nouveau code
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
