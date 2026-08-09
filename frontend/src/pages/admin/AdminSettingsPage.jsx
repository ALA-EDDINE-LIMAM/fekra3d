import AdminShell from '../../components/AdminShell';

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Settings" description="Configure storefront and notification options.">
      <form className="glass-panel space-y-4 p-6">
        <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" placeholder="Store name" defaultValue="fekra3D" />
        <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" placeholder="Support email" defaultValue="support@fekra3d.com" />
        <button type="button" className="rounded-xl bg-[#47d7c6] px-5 py-3 font-semibold text-slate-950">
          Save settings
        </button>
      </form>
    </AdminShell>
  );
}
