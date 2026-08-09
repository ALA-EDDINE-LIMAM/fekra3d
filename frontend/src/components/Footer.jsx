import { Link } from 'react-router-dom';
import { footerBrand, footerLinks, footerSocialLinks } from './footerData';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/10 bg-[var(--background)] dark:bg-[#060b12] transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.9fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-900 dark:text-slate-400">{footerBrand.name}</div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">{footerBrand.description}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1">Impression 3D</span>
              <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1">Sur mesure</span>
              <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1">Livraison rapide</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-900 dark:text-slate-400">Liens utiles</div>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              {footerLinks.map((link) => (
                <Link key={link.href} to={link.href} className="text-slate-700 dark:text-slate-300 transition-colors hover:text-slate-950 dark:hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-900 dark:text-slate-400">Contact & Réseaux</div>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              {footerSocialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-700 dark:text-slate-300 transition-colors hover:text-slate-950 dark:hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 dark:border-white/10 pt-6 text-xs text-slate-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 fekra3D. Tous droits réservés.</span>
            <span>Conçu pour présenter les produits, les commandes et vos demandes personnalisées.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}