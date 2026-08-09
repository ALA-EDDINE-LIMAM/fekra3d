import { useState } from 'react';
import { CheckCircle, Link2, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import PageShell from '../components/PageShell';
import { apiBaseUrl } from '../services/api';

export default function SurMesurePage() {
  const [formData, setFormData] = useState({
    projectName: '',
    stlLink: '',
    material: '',
    quality: 'standard',
    instructions: '',
    fullName: '',
    email: '',
    phone: ''
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let uploadedFileUrl = '';

      // 1. If there's a file, upload it first
      if (file) {
        const fileData = new FormData();
        fileData.append('file', file);

        const uploadRes = await fetch(`${apiBaseUrl}/api/upload`, {
          method: 'POST',
          body: fileData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Échec de l'upload du fichier.");
        }

        const uploadJson = await uploadRes.json();
        uploadedFileUrl = uploadJson.url;
      }

      // 2. Submit custom request payload
      const descriptionText = [
        `Projet : ${formData.projectName}`,
        `Matériau : ${formData.material}`,
        `Qualité : ${formData.quality}`,
        formData.stlLink ? `Lien STL : ${formData.stlLink}` : '',
        formData.instructions ? `Instructions : ${formData.instructions}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        description: descriptionText,
        file_url: uploadedFileUrl || formData.stlLink || ''
      };

      const response = await fetch(`${apiBaseUrl}/api/custom-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Erreur de soumission de la demande.");
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <PageShell eyebrow="Sur Mesure" title="Demande envoyée" description="Nous allons étudier votre modèle, vos options et vos coordonnées avant de vous envoyer un devis.">
        <div className="glass-panel mx-auto max-w-2xl p-8 text-center border border-slate-200 dark:border-white/10 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Demande bien reçue !</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Merci pour votre confiance. Notre équipe analysera la faisabilité de votre impression 3D et vous contactera dans les plus brefs délais avec un devis personnalisé.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Sur Mesure"
      title="Créer une impression personnalisée"
      description="Partagez un lien vers un modèle 3D ou téléchargez votre propre fichier STL pour obtenir un devis rapide."
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="glass-panel space-y-6 p-6 sm:p-8 border border-slate-200 dark:border-white/10 rounded-3xl bg-white/80 dark:bg-[#1e293b]/20 backdrop-blur-md">
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Informations personnelles */}
          <div className="border-b border-slate-200 dark:border-white/10 pb-5 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Vos coordonnées</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nom complet</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none transition-colors focus:border-[#47d7c6] focus:bg-white dark:focus:bg-slate-950"
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Numéro de téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none transition-colors focus:border-[#47d7c6] focus:bg-white dark:focus:bg-slate-950"
                  placeholder="Ex: 55 555 555"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Adresse e-mail</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none transition-colors focus:border-[#47d7c6] focus:bg-white dark:focus:bg-slate-950"
                placeholder="Ex: jean.dupont@gmail.com"
              />
            </div>
          </div>

          {/* Détails du projet */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Détails de l'impression</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nom du projet</label>
              <input
                type="text"
                name="projectName"
                required
                value={formData.projectName}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none transition-colors focus:border-[#47d7c6] focus:bg-white dark:focus:bg-slate-950"
                placeholder="Ex: Boîtier d'engrenage de rechange"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Link2 size={16} /> Lien STL ou page produit
              </label>
              <input
                type="url"
                name="stlLink"
                value={formData.stlLink}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none transition-colors focus:border-[#47d7c6] focus:bg-white dark:focus:bg-slate-950"
                placeholder="https://thingiverse.com/model... ou similaire"
              />
              <p className="text-xs leading-5 text-slate-500">
                Collez un lien Thingiverse, Printables, GrabCAD ou autre site de partage de modèles 3D.
              </p>
            </div>

            <div className="space-y-3 rounded-3xl border border-dashed border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/40 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <UploadCloud size={16} /> Télécharger un fichier (STL, OBJ, 3MF)
              </div>
              <p className="text-xs text-slate-500">Maximum 50 Mo. Recommandé si vous possédez déjà le modèle.</p>
              <input
                type="file"
                accept=".stl,.obj,.3mf"
                onChange={handleFileChange}
                className="w-full cursor-pointer rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#47d7c6] file:px-4 file:py-2 file:font-semibold file:text-slate-950"
              />
              {file && (
                <div className="text-xs text-emerald-400 font-medium">
                  Fichier sélectionné : {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} Mo)
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Matériau souhaité</label>
                <select
                  name="material"
                  required
                  value={formData.material}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none transition-colors focus:border-[#47d7c6] focus:bg-white dark:focus:bg-slate-950"
                >
                  <option value="">Sélectionnez un matériau...</option>
                  <option value="PLA">PLA (Standard / Biodégradable)</option>
                  <option value="PETG">PETG (Résistant au soleil / Solide)</option>
                  <option value="TPU">TPU (Flexible / Caoutchouc)</option>
                  <option value="Résine">Résine (Haute précision / Figurines)</option>
                  <option value="Autre / Je ne sais pas">Autre / Je ne sais pas</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Qualité de finition</label>
                <select
                  name="quality"
                  required
                  value={formData.quality}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none transition-colors focus:border-[#47d7c6] focus:bg-white dark:focus:bg-slate-950"
                >
                  <option value="standard">Standard (0.2mm - Équilibré)</option>
                  <option value="high">Haute précision (0.12mm - Fin)</option>
                  <option value="ultra">Ultra Haute précision (0.08mm - Très fin)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Instructions supplémentaires</label>
              <textarea
                name="instructions"
                rows={4}
                value={formData.instructions}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none transition-colors focus:border-[#47d7c6] focus:bg-white dark:focus:bg-slate-950 resize-none"
                placeholder="Couleur souhaitée, dimensions exactes, usage mécanique, urgence..."
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#47d7c6] hover:bg-[#3ec4b4] px-5 py-4 font-semibold text-slate-950 transition-colors disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Traitement et envoi en cours...
              </>
            ) : (
              'Envoyer ma demande de devis'
            )}
          </button>
        </form>

        <div className="glass-panel space-y-6 p-6 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-3xl bg-white/50 dark:bg-[#1e293b]/10">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Comment ça marche ?</h2>
          <ol className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">1</span>
              <span>Remplissez le formulaire et envoyez-nous le lien ou le fichier 3D de votre projet.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">2</span>
              <span>Notre équipe étudie les fichiers sous 24h pour vérifier la faisabilité de l'impression.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">3</span>
              <span>Nous vous envoyons un devis personnalisé par e-mail avec un lien direct pour régler votre commande.</span>
            </li>
          </ol>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Formats acceptés :</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Fichiers modèles 3D : .STL, .OBJ, .3MF (max 50 Mo).</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
