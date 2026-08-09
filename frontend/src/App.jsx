import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import ProductPage from './pages/ProductPage';
import ContactPage from './pages/ContactPage';
import PanierPage from './pages/PanierPage';
import CheckoutPage from './pages/CheckoutPage';
import SuiviPage from './pages/SuiviPage';
import SurMesurePage from './pages/SurMesurePage';
import LoginPage from './pages/admin/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminCustomRequestsPage from './pages/admin/AdminCustomRequestsPage';
import ScrollToTopButton from './components/ScrollToTopButton.jsx';

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminRoute && <Navbar />}
      <main className={`flex-1 ${!isAdminRoute ? 'pt-16' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/produit/:id" element={<ProductPage />} />
          <Route path="/panier" element={<PanierPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/suivi" element={<SuiviPage />} />
          <Route path="/sur-mesure" element={<SurMesurePage />} />
          
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/customers" element={<AdminCustomersPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/custom-requests" element={<AdminCustomRequestsPage />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ScrollToTopButton />}
    </div>
  );
}
