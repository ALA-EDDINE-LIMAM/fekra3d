import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, Menu, Search, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useProducts, getProductSearchScore } from '../utils/products';

const navItems = [
  { to: '/', label: 'Accueil' },
  { to: '/contact', label: 'Contact' },
  { to: '/sur-mesure', label: 'Sur mesure' },
  { to: '/suivi', label: 'Suivi' },
];

export default function Navbar() {
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const allProducts = useProducts() || [];
  const location = useLocation();

  const isLinkActive = (path, category = null) => {
    const searchParams = new URLSearchParams(location.search);
    const activeCategory = searchParams.get('category');
    
    if (path === '/catalogue') {
      if (category) {
        return location.pathname === '/catalogue' && activeCategory === category;
      }
      return location.pathname === '/catalogue' && !activeCategory;
    }
    
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getCategoryClass = (categoryName) => {
    const active = isLinkActive('/catalogue', categoryName);
    return `px-4 py-2.5 rounded-xl transition-all font-medium ${active ? 'text-[#47d7c6] bg-[#47d7c6]/10' : 'text-slate-700 dark:text-slate-300 hover:text-[#47d7c6] dark:hover:text-[#47d7c6] hover:bg-slate-50 dark:hover:bg-white/5'}`;
  };

  const getTousLesProduitsClass = () => {
    const active = isLinkActive('/catalogue');
    return `block px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl transition-all font-medium ${active ? 'text-[#47d7c6] border-[#47d7c6]/30 bg-slate-50 dark:bg-white/10' : 'text-slate-800 dark:text-slate-200 hover:border-[#47d7c6]/50 dark:hover:border-[#47d7c6]/30 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#47d7c6] dark:hover:text-[#47d7c6]'}`;
  };

  const getUtilLinkClass = (path) => {
    const active = isLinkActive(path);
    return `block px-4 py-2.5 rounded-xl transition-all font-medium ${active ? 'text-[#47d7c6] bg-[#47d7c6]/10' : 'text-slate-700 dark:text-slate-300 hover:text-[#47d7c6] hover:bg-slate-50 dark:hover:bg-white/5'}`;
  };

  const SIDEBAR_CATEGORIES = [
    'Porte clé',
    'Accessoire',
    'Pièces de rechange mécanique',
    'Figurines & Articulés',
    'Décoration & Maison'
  ];

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        // Optionnel : on pourrait aussi fermer isMobileSearchOpen, mais on masque au moins les suggestions
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];

    return allProducts
      .map((product) => ({
        product,
        score: getProductSearchScore(product, query),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ product }) => product);
  }, [searchQuery, allProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalogue');
    }
  };

  return (
    <>
      <nav className="glass-nav fixed top-0 z-40 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">

          {/* Left: Logo (takes up remaining space to push everything else right) */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-900 dark:text-white hover:text-[#47d7c6] transition-colors"
            >
              <Menu size={24} />
            </button>

            <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              <span
                className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white bg-center bg-cover shadow-[0_0_0_1px_rgba(71,215,198,0.18)]"
                style={{ backgroundImage: 'url(/logo.jpg)' }}
                aria-label="fekra3D logo"
                role="img"
              />
              <span className="hidden sm:block">fekra3D</span>
            </Link>
          </div>

          {/* Right: Links + Search + Actions */}
          <div className="flex items-center gap-6 lg:gap-10">
            {/* Navigation Links */}
            <div className="hidden items-center gap-8 text-[15px] font-medium text-slate-700 dark:text-slate-300 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `transition-colors hover:text-[#47d7c6] dark:hover:text-[#47d7c6] ${isActive ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Actions (Search, Theme, Cart) */}
            <div className="flex items-center gap-3">
              {/* Desktop Search */}
              <form ref={desktopSearchRef} onSubmit={handleSearch} className="hidden sm:flex items-center relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full py-1.5 pl-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#47d7c6] w-48 lg:w-64"
                />
                <button type="submit" className="absolute right-3 text-slate-500 hover:text-[#47d7c6]">
                  <Search size={16} />
                </button>
                {isSearchFocused && searchQuery.trim() && (
                  <div className="absolute top-full mt-3 right-0 w-[380px] bg-white dark:bg-[#0c1420] border border-slate-200 dark:border-white/10 shadow-2xl rounded-xl z-[9999] opacity-100 visible pointer-events-auto text-left">
                    {/* Tooltip arrow */}
                    <div className="absolute -top-[9px] right-8 w-4 h-4 bg-white dark:bg-[#0c1420] border-t border-l border-slate-200 dark:border-white/10 transform rotate-45"></div>

                    {searchSuggestions.length > 0 ? (
                      <div className="max-h-[400px] overflow-y-auto overflow-x-hidden py-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {searchSuggestions.map(product => (
                          <Link
                            key={product.id}
                            to={`/produit/${product.id}`}
                            onClick={() => setSearchQuery('')}
                            className="group flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                          >
                            <div className="h-12 w-12 bg-white dark:bg-slate-900/50 rounded overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5">
                              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex flex-col flex-1">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#47d7c6] transition-colors line-clamp-2 leading-tight mb-1">{product.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[15px] font-bold text-slate-950 dark:text-[#47d7c6]">
                                  {Number(product.price).toFixed(3)} <span className="text-[10px]">TND</span>
                                </span>
                                {product.originalPrice && (
                                  <span className="text-xs text-slate-400 line-through font-medium">
                                    {Number(product.originalPrice).toFixed(3)} TND
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                        Aucun produit trouvé pour "{searchQuery}".
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Mobile Search Icon */}
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="sm:hidden rounded-md bg-transparent p-1 text-slate-700 dark:text-white/90 transition hover:text-slate-900 dark:hover:text-white"
                aria-label="Rechercher"
              >
                <Search size={22} />
              </button>

              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="rounded-md bg-transparent p-1 text-slate-700 dark:text-white/90 transition hover:text-slate-900 dark:hover:text-white"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <Link
                to="/panier"
                className="relative inline-flex items-center justify-center text-slate-700 dark:text-white transition-colors hover:text-[#47d7c6]"
              >
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#47d7c6] px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search Input Overlay */}
        {isMobileSearchOpen && (
          <div ref={mobileSearchRef} className="absolute top-16 left-0 w-full bg-white dark:bg-[#0c1420] border-b border-slate-200 dark:border-white/10 p-4 sm:hidden shadow-lg animate-in slide-in-from-top-2">
            <form onSubmit={(e) => { setIsMobileSearchOpen(false); handleSearch(e); }} className="relative flex items-center">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#47d7c6] shadow-inner"
                autoFocus
              />
              <button type="submit" className="absolute right-4 text-slate-500 hover:text-[#47d7c6] p-2">
                <Search size={18} />
              </button>
            </form>

            {isSearchFocused && searchQuery.trim() && (
              <div className="mt-3 bg-white dark:bg-[#0c1420] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col relative z-[9999] text-left">
                {/* Tooltip arrow */}
                <div className="absolute -top-[9px] right-8 w-4 h-4 bg-white dark:bg-[#0c1420] border-t border-l border-slate-200 dark:border-white/10 transform rotate-45 z-10 hidden sm:block"></div>

                {searchSuggestions.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto overflow-x-hidden py-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {searchSuggestions.map(product => (
                      <Link
                        key={product.id}
                        to={`/produit/${product.id}`}
                        onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }}
                        className="group flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                      >
                        <div className="h-12 w-12 bg-white dark:bg-slate-900/50 rounded overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#47d7c6] transition-colors line-clamp-2 leading-tight mb-1">{product.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-bold text-slate-950 dark:text-[#47d7c6]">
                              {Number(product.price).toFixed(3)} <span className="text-[10px]">TND</span>
                            </span>
                            {product.originalPrice && (
                              <span className="text-xs text-slate-400 line-through font-medium">
                                {Number(product.originalPrice).toFixed(3)} TND
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                    Aucun produit trouvé pour "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative w-80 max-w-full bg-white dark:bg-[#0c1420] border-r border-slate-200 dark:border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Catégories</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-2">Catégories</h3>

              {SIDEBAR_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  to={`/catalogue?category=${encodeURIComponent(category)}`}
                  onClick={() => setIsSidebarOpen(false)}
                  className={getCategoryClass(category)}
                >
                  {category}
                </Link>
              ))}
              <div className="px-2 mt-2 mb-4">
                <Link
                  to="/catalogue"
                  onClick={() => setIsSidebarOpen(false)}
                  className={getTousLesProduitsClass()}
                >
                  Tous les produits
                </Link>
              </div>

              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-2 mt-2">Liens Utiles</h3>

              <Link
                to="/"
                onClick={() => setIsSidebarOpen(false)}
                className={getUtilLinkClass('/')}
              >
                Accueil
              </Link>
              <Link
                to="/sur-mesure"
                onClick={() => setIsSidebarOpen(false)}
                className={getUtilLinkClass('/sur-mesure')}
              >
                Sur mesure
              </Link>
              <Link
                to="/suivi"
                onClick={() => setIsSidebarOpen(false)}
                className={getUtilLinkClass('/suivi')}
              >
                Suivi de commande
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsSidebarOpen(false)}
                className={`${getUtilLinkClass('/contact')} block md:hidden`}
              >
                Contact
              </Link>

              <div className="mt-4 pt-6 border-t border-slate-200 dark:border-white/10 pb-6">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-2 mb-2">Contact & Réseaux</h3>

                <div className="px-4 flex flex-col gap-5 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#47d7c6] dark:hover:text-[#47d7c6] transition-colors">Instagram</a>
                    <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#47d7c6] dark:hover:text-[#47d7c6] transition-colors">WhatsApp</a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#47d7c6] dark:hover:text-[#47d7c6] transition-colors">Facebook</a>
                  </div>
                  <div className="flex flex-col gap-3">
                    <a href="mailto:contact@fekra3d.com" className="hover:text-[#47d7c6] dark:hover:text-[#47d7c6] transition-colors flex items-center gap-3">
                      <svg className="w-4 h-4 text-slate-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      contact@fekra3d.com
                    </a>
                    <a href="tel:+21650000000" className="hover:text-[#47d7c6] dark:hover:text-[#47d7c6] transition-colors flex items-center gap-3">
                      <svg className="w-4 h-4 text-slate-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                      +216 50 000 000
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
