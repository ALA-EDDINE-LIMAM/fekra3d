import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiBaseUrl } from '../services/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi");
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <PageShell>
      <div className="mx-auto mt-4 max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0c1420] flex flex-col lg:flex-row">
        
        {/* Left Side: Contact Info */}
        <div className="relative overflow-hidden bg-slate-900 px-8 py-12 lg:px-12 lg:py-16 text-white lg:w-5/12 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc]/20 to-[#47d7c6]/20"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-4">Contactez-nous</h1>
            <p className="text-slate-300 mb-12 text-lg">
              Une question ? Un projet sur mesure ? N'hésitez pas à nous écrire, notre équipe vous répondra dans les plus brefs délais.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#47d7c6] backdrop-blur-md">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">Email</h3>
                  <p className="text-slate-300">fekra3d.printing@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#47d7c6] backdrop-blur-md">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">Téléphone</h3>
                  <p className="text-slate-300">+216 55 084 823</p>
                </div>
              </div>

              <div className="flex items-start gap-5 flex-col">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#47d7c6] backdrop-blur-md">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Atelier</h3>
                    <p className="text-slate-300">Kélibia, Tunisie</p>
                  </div>
                </div>
                <div className="w-full mt-2 rounded-xl overflow-hidden shadow-lg border border-white/10">
                  <iframe 
                    src="https://maps.google.com/maps?q=Kélibia,+Tunisia&t=&z=14&ie=UTF8&iwloc=&output=embed" 
                    width="100%" 
                    height="180" 
                    frameBorder="0" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    aria-hidden="false" 
                    tabIndex="0">
                  </iframe>
                  <a href="https://maps.app.goo.gl/DryuVUZxhdo1K9M4A" target="_blank" rel="noopener noreferrer" className="block w-full bg-white/5 hover:bg-white/10 transition-colors text-center py-2 text-sm text-[#47d7c6] font-medium border-t border-white/10">Ouvrir dans Google Maps</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="px-8 py-12 lg:px-12 lg:py-16 lg:w-7/12 bg-white dark:bg-[#0c1420]">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
            Envoyez-nous un message
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom complet</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition-colors focus:border-[#0066cc] focus:bg-white focus:ring-1 focus:ring-[#0066cc] dark:border-white/10 dark:bg-[#0b1118] dark:text-white dark:focus:border-[#47d7c6] dark:focus:ring-[#47d7c6]"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition-colors focus:border-[#0066cc] focus:bg-white focus:ring-1 focus:ring-[#0066cc] dark:border-white/10 dark:bg-[#0b1118] dark:text-white dark:focus:border-[#47d7c6] dark:focus:ring-[#47d7c6]"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Sujet</label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition-colors focus:border-[#0066cc] focus:bg-white focus:ring-1 focus:ring-[#0066cc] dark:border-white/10 dark:bg-[#0b1118] dark:text-white dark:focus:border-[#47d7c6] dark:focus:ring-[#47d7c6]"
                placeholder="De quoi voulez-vous parler ?"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition-colors focus:border-[#0066cc] focus:bg-white focus:ring-1 focus:ring-[#0066cc] dark:border-white/10 dark:bg-[#0b1118] dark:text-white dark:focus:border-[#47d7c6] dark:focus:ring-[#47d7c6]"
                placeholder="Votre message ici..."
              />
            </div>

            {status === 'success' && (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={20} />
                <p className="text-sm font-medium">Votre message a été envoyé avec succès !</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-red-600 dark:text-red-400">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">Une erreur est survenue lors de l'envoi. Veuillez réessayer plus tard.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066cc] px-6 py-4 font-semibold text-white transition-all hover:bg-[#0052a3] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#47d7c6] dark:text-slate-950 dark:hover:bg-[#3bc2b2]"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Envoyer le message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
