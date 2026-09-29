import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, FileCode, ShoppingBag, Users, ShieldCheck, Menu, X } from 'lucide-react';
import { apiBaseUrl } from '../services/api';
import { ADMIN_PATH } from '../config/adminConfig';

const adminLinks = [
  { to: ADMIN_PATH, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: `${ADMIN_PATH}/orders`, label: 'Commandes', icon: ShoppingBag },
  { to: `${ADMIN_PATH}/customers`, label: 'Clients', icon: Users },
  { to: `${ADMIN_PATH}/products`, label: 'Produits', icon: Package },
  { to: `${ADMIN_PATH}/custom-requests`, label: 'Commandes Sur-Mesure', icon: FileCode },
  { to: `${ADMIN_PATH}/settings`, label: 'Gestion Admins', icon: ShieldCheck }
];


export default function AdminShell({ title, description, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate(`${ADMIN_PATH}/login`);
      return;
    }

    // Verify token with backend
    fetch(`${apiBaseUrl}/api/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) {
          setAuthorized(true);
        } else {
          localStorage.removeItem('admin_token');
          navigate(`${ADMIN_PATH}/login`);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback for network issues (trust storage but don't clear)
        setAuthorized(true);
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate(`${ADMIN_PATH}/login`);
  };


  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#07111d] text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-400 border-r-2 border-r-transparent mb-4"></div>
        <p className="text-slate-400 font-medium text-sm">Vérification de la session admin...</p>
      </div>
    );
  }

  if (!authorized) return null;

  const renderNavigation = () => (
    <>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {adminLinks.map((link) => {
          const isActive = link.exact
            ? location.pathname === link.to
            : location.pathname.startsWith(link.to);

          const Icon = link.icon;

          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-300 cursor-pointer"
        >
          <LogOut size={20} />
          Se déconnecter
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#07111d]">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="relative flex h-full w-80 max-w-full flex-col border-r border-white/10 bg-[#0c1420] shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
              <span className="text-xl font-bold uppercase tracking-widest text-white">Admin</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Fermer le menu admin"
              >
                <X size={22} />
              </button>
            </div>
            {renderNavigation()}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Area for Title */}
        <header className="h-20 flex items-center justify-between gap-4 px-8 border-b border-white/10 bg-[#1e293b]/30 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="shrink-0 rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Ouvrir le menu admin"
            >
              <Menu size={24} />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
               <span className="text-emerald-400 font-bold">A</span>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
