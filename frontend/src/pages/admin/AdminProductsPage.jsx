import AdminShell from '../../components/AdminShell';
import ProductManager from '../../components/admin/ProductManager';

export default function AdminProductsPage() {
  return (
    <AdminShell title="Products" description="Manage the product catalog and pricing.">
      <ProductManager />
    </AdminShell>
  );
}
