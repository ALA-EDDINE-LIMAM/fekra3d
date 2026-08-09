"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Edit2, Image as ImageIcon, Loader2, Plus, Search, Trash2, Upload, X, Box } from 'lucide-react';
import { apiBaseUrl } from '../../services/api';
import { getProducts, products as fallbackProducts, saveProducts } from '../../utils/products';

type CategoryOption = {
  id: string;
  name: string;
};

type ProductRecord = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  stock?: number | null;
  image_url?: string | null;
  images?: string[] | string | null;
  category_id?: string | null;
  Category?: { name?: string | null } | null;
  features?: string[];
  model3d?: string | null;
  colors?: string[];
  materials?: string[];
  customizableParts?: number | null;
  dimensions?: string | null;
  weight?: string | null;
};

type ProductFormState = {
  name: string;
  categoryId: string;
  price: string;
  originalPrice: string;
  stock: string;
  description: string;
  imageUrl: string;
  images: string[];
  model3d: string;
  colors: string;
  materials: string;
  customizableParts: string;
  dimensions: string;
  weight: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Porte clé' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Accessoire' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Pièces de rechange mécanique' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Figurines & Articulés' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Décoration & Maison' },
];

const EMPTY_FORM: ProductFormState = {
  name: '',
  categoryId: CATEGORY_OPTIONS[0]?.id ?? '',
  price: '',
  originalPrice: '',
  stock: '0',
  description: '',
  imageUrl: '',
  images: [],
  model3d: '',
  colors: '',
  materials: '',
  customizableParts: '1',
  dimensions: '',
  weight: '',
};

const apiPath = (path: string) => `${apiBaseUrl}${path}`;

const normalizeImages = (value: ProductRecord['images'], fallback: string[] = []) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      return [value.trim()];
    }
  }

  return fallback;
};

const normalizeProduct = (product: ProductRecord) => {
  const images = normalizeImages(product.images, product.image_url ? [product.image_url] : []);
  return {
    ...product,
    name: product.name ?? '',
    description: product.description ?? '',
    price: Number(product.price) || 0,
    originalPrice: product.original_price ? Number(product.original_price) : null,
    stock: Number(product.stock ?? 0),
    categoryId: product.category_id ?? '',
    categoryName: product.Category?.name ?? 'Sans catégorie',
    imageUrl: product.image_url ?? images[0] ?? '',
    images: images.length > 0 ? images : product.image_url ? [product.image_url] : [],
    model3d: product.model3d ?? '',
    colors: product.colors ?? [],
    materials: product.materials ?? [],
    customizableParts: Number(product.customizableParts ?? 1),
    dimensions: product.dimensions ?? '',
    weight: product.weight ?? '',
  };
};

const mergeWithDefaultProduct = (product: ProductRecord) => {
  const defaultProduct = fallbackProducts.find((entry) => entry.id === product.id);
  return {
    ...defaultProduct,
    ...product,
    features: product.features ?? defaultProduct?.features ?? [],
  };
};

const asStoredProductList = (records: ProductRecord[]) => records.map(mergeWithDefaultProduct);

const formFromProduct = (product: ReturnType<typeof normalizeProduct>): ProductFormState => ({
  name: product.name,
  categoryId: product.categoryId || CATEGORY_OPTIONS[0]?.id || '',
  price: String(product.price),
  originalPrice: product.originalPrice ? String(product.originalPrice) : '',
  stock: String(product.stock ?? 0),
  description: product.description ?? '',
  imageUrl: product.imageUrl ?? '',
  images: product.images ?? [],
  model3d: product.model3d ?? '',
  colors: product.colors?.join(', ') ?? '',
  materials: product.materials?.join(', ') ?? '',
  customizableParts: String(product.customizableParts ?? 1),
  dimensions: product.dimensions ?? '',
  weight: product.weight ?? '',
});

const uploadFileToBackend = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('admin_token');
  const response = await fetch(apiPath('/api/upload'), {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.url;
};

export default function ProductManager() {
  const [products, setProducts] = useState<ReturnType<typeof normalizeProduct>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);

  const editingProduct = products.find((product) => product.id === editingProductId) ?? null;

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const response = await fetch(apiPath('/api/products'));
        if (!response.ok) {
          throw new Error(`Erreur serveur ${response.status}`);
        }
        const data = (await response.json()) as ProductRecord[];
        const mergedProducts = asStoredProductList(data);
        saveProducts(mergedProducts);
        setProducts(mergedProducts.map(normalizeProduct));
      } catch {
        const localProducts = getProducts();
        saveProducts(localProducts);
        setProducts(localProducts.map(normalizeProduct));
        setErrorMessage('Mode local activé: impossible de joindre l’API, les produits sont affichés depuis le catalogue intégré.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return [product.name, product.description, product.categoryName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [products, search]);

  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((product) => Number(product.stock ?? 0) > 0).length;
    const averagePrice =
      total > 0 ? products.reduce((sum, product) => sum + Number(product.price || 0), 0) / total : 0;

    return {
      total,
      inStock,
      averagePrice,
    };
  }, [products]);

  const openCreateModal = () => {
    setEditingProductId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (product: ReturnType<typeof normalizeProduct>) => {
    setEditingProductId(product.id);
    setForm(formFromProduct(product));
    setIsModalOpen(true);
  };

  const updateForm = (field: keyof ProductFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const appendFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const uploadedImages = await Promise.all(
        Array.from(files).map((file) => uploadFileToBackend(file))
      );

      setForm((current) => {
        const nextImages = [...current.images, ...uploadedImages];
        return {
          ...current,
          images: nextImages,
          imageUrl: current.imageUrl || nextImages[0] || '',
        };
      });
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'upload des images. Vérifiez que votre serveur backend Node.js (localhost:5000) est allumé.");
    }
  };

  const handleModel3DUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert("⚠️ Fichier trop volumineux. La limite est fixée à 100 Mo.");
        return;
      }
      try {
        const url = await uploadFileToBackend(file);
        updateForm('model3d', url);
      } catch (error) {
        console.error(error);
        alert("Erreur lors de l'upload du modèle 3D. Vérifiez que votre serveur backend Node.js (localhost:5000) est allumé.");
      }
    }
    event.target.value = '';
  };

  const addColor = () => {
    updateForm('colors', form.colors ? `${form.colors},#ffffff` : '#ffffff');
  };

  const updateColor = (index: number, newColor: string) => {
    const colorArray = form.colors.split(',').map(c => c.trim()).filter(Boolean);
    colorArray[index] = newColor;
    updateForm('colors', colorArray.join(','));
  };

  const removeColor = (index: number) => {
    const colorArray = form.colors.split(',').map(c => c.trim()).filter(Boolean);
    colorArray.splice(index, 1);
    updateForm('colors', colorArray.join(','));
  };

  const removeImage = (imageIndex: number) => {
    setForm((current) => {
      const nextImages = current.images.filter((_, index) => index !== imageIndex);
      const nextPrimaryImage = current.imageUrl === current.images[imageIndex] ? nextImages[0] ?? '' : current.imageUrl;
      return {
        ...current,
        images: nextImages,
        imageUrl: nextPrimaryImage,
      };
    });
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
    setForm(EMPTY_FORM);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const saveProduct = async () => {
    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const originalPrice = form.originalPrice ? Number(form.originalPrice) : null;
    const stock = Number(form.stock);
    const images = form.images.map((image) => image.trim()).filter(Boolean);
    const primaryImage = form.imageUrl.trim() || images[0] || '';

    if (!name || Number.isNaN(price)) {
      showToast('Ajoutez au minimum un nom et un prix valides.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      const token = localStorage.getItem('admin_token');
      const response = await fetch(apiPath(editingProductId ? `/api/products/${editingProductId}` : '/api/products'), {
        method: editingProductId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          price,
          original_price: originalPrice,
          stock: Number.isNaN(stock) ? 0 : stock,
          category_id: form.categoryId,
          image_url: primaryImage,
          images: images.length > 0 ? images : primaryImage ? [primaryImage] : [],
          model3d: form.model3d.trim() || null,
          colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
          materials: form.materials.split(',').map((m) => m.trim()).filter(Boolean),
          customizableParts: Number.isNaN(Number(form.customizableParts)) ? 1 : Number(form.customizableParts),
          dimensions: form.dimensions.trim() || null,
          weight: form.weight.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(payload?.error ?? payload?.message ?? 'Impossible d’enregistrer le produit.');
      }

      const savedProduct = normalizeProduct({
        ...(await response.json()),
        features: editingProduct?.features ?? fallbackProducts.find((product) => product.id === editingProductId)?.features ?? [],
      } as ProductRecord);

      const nextProducts = editingProductId
        ? products.map((product) => (product.id === editingProductId ? savedProduct : product))
        : [savedProduct, ...products];

      setProducts(nextProducts);
      saveProducts(nextProducts);

      showToast(editingProductId ? 'Produit mis à jour.' : 'Produit ajouté.');
      resetModal();
    } catch {
      const savedProduct = {
        id: editingProductId ?? crypto.randomUUID(),
        name,
        description,
        price,
        original_price: originalPrice,
        stock: Number.isNaN(stock) ? 0 : stock,
        image_url: primaryImage || null,
        images: images.length > 0 ? images : primaryImage ? [primaryImage] : [],
        category_id: form.categoryId,
        Category: {
          name: CATEGORY_OPTIONS.find((category) => category.id === form.categoryId)?.name ?? 'Sans catégorie',
        },
        features: editingProduct?.features ?? [],
        model3d: form.model3d.trim() || null,
        colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
        materials: form.materials.split(',').map((m) => m.trim()).filter(Boolean),
        customizableParts: Number.isNaN(Number(form.customizableParts)) ? 1 : Number(form.customizableParts),
        dimensions: form.dimensions.trim() || null,
        weight: form.weight.trim() || null,
      } satisfies ProductRecord;

      const localProducts = getProducts();
      const nextProducts = editingProductId
        ? localProducts.map((entry) => (entry.id === editingProductId ? savedProduct : entry))
        : [savedProduct, ...localProducts];

      saveProducts(nextProducts);
      setProducts(nextProducts.map(normalizeProduct));
      showToast(editingProductId ? 'Produit mis à jour en mode local.' : 'Produit ajouté en mode local.');
      resetModal();
      setErrorMessage('');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product: ReturnType<typeof normalizeProduct>) => {
    const confirmed = window.confirm(`Voulez-vous vraiment supprimer "${product.name}" ?`);
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(apiPath(`/api/products/${product.id}`), { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok && response.status !== 204) {
        throw new Error('Impossible de supprimer ce produit.');
      }

      const nextProducts = products.filter((entry) => entry.id !== product.id);
      setProducts(nextProducts);
      saveProducts(nextProducts);
      showToast('Produit supprimé.');
    } catch {
      const localProducts = getProducts();
      const nextProducts = localProducts.filter((entry) => entry.id !== product.id);
      saveProducts(nextProducts);
      setProducts(nextProducts.map(normalizeProduct));
      showToast('Produit supprimé en mode local.');
      setErrorMessage('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {toastMessage ? (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-2xl shadow-emerald-950/30">
          <Check size={16} />
          {toastMessage}
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Catalogue</div>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-5xl">Gestion des produits</h2>
            <p className="mt-4 text-base leading-7 text-slate-400 md:text-lg">
              Créez, modifiez et supprimez vos produits avec aperçu des images, stock et catégorie.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#47d7c6] px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Ajouter un produit
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0b1118] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Produits</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b1118] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">En stock</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stats.inStock}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b1118] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Prix moyen</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stats.averagePrice.toFixed(3)} TND</div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[#081018]/95 shadow-[0_30px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom, description ou catégorie"
              className="w-full rounded-2xl border border-white/10 bg-[#0b1118] py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
            />
          </div>

          <div className="text-sm text-slate-400">{filteredProducts.length} produit(s) affiché(s)</div>
        </div>

        {errorMessage ? (
          <div className="mx-6 mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="overflow-x-auto p-6">
          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] text-slate-400">
              <Loader2 className="mr-2 animate-spin" size={18} />
              Chargement des produits...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] text-center text-slate-400">
              <ImageIcon size={28} className="mb-3 text-slate-500" />
              <div className="text-lg font-medium text-white">Aucun produit trouvé</div>
              <p className="mt-2 max-w-sm text-sm text-slate-400">Ajoutez un produit ou ajustez votre recherche pour voir apparaître vos articles.</p>
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-y-3 text-left">
              <thead>
                <tr className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  <th className="px-4 py-2 font-semibold">Produit</th>
                  <th className="px-4 py-2 font-semibold">Catégorie</th>
                  <th className="px-4 py-2 font-semibold">Prix</th>
                  <th className="px-4 py-2 font-semibold">Stock</th>
                  <th className="px-4 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="rounded-3xl bg-white/[0.03] transition-colors hover:bg-white/[0.06]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="grid h-16 w-16 grid-cols-2 gap-0.5 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1118] p-0.5">
                          {(product.images.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : []).slice(0, 4).map((image, index) => (
                            <img
                              key={`${product.id}-${index}`}
                              src={image}
                              alt={product.name}
                              className="h-full w-full rounded-xl object-cover"
                            />
                          ))}
                          {product.images.length === 0 && !product.imageUrl ? (
                            <div className="col-span-2 flex items-center justify-center text-slate-500">
                              <ImageIcon size={18} />
                            </div>
                          ) : null}
                        </div>
                        <div>
                          <div className="text-base font-semibold text-white">{product.name}</div>
                          <div className="mt-1 max-w-xl text-sm leading-6 text-slate-400 line-clamp-2">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{product.categoryName}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-white">
                      {Number(product.price).toFixed(3)} TND
                      {product.originalPrice ? (
                        <span className="ml-2 text-xs font-normal text-slate-500 line-through">
                          {Number(product.originalPrice).toFixed(2)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${Number(product.stock ?? 0) > 0 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>
                        {Number(product.stock ?? 0) > 0 ? `${product.stock} en stock` : 'Rupture'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                        >
                          <Edit2 size={16} />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/15"
                        >
                          <Trash2 size={16} />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#07111d] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{editingProduct ? 'Modifier' : 'Nouveau produit'}</div>
                <h3 className="mt-2 text-2xl font-semibold text-white">{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h3>
                <p className="mt-2 text-sm text-slate-400">Ajoutez une ou plusieurs images et ajustez le stock sans quitter la page.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Nom du produit</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => updateForm('name', event.target.value)}
                    placeholder="Ex: Figurine Batman"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Catégorie</label>
                    <select
                      value={form.categoryId}
                      onChange={(event) => updateForm('categoryId', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors focus:border-[#47d7c6]/50"
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Prix (TND)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(event) => updateForm('price', event.target.value)}
                        placeholder="45.00"
                        className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Ancien prix</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.originalPrice}
                        onChange={(event) => updateForm('originalPrice', event.target.value)}
                        placeholder="Barré (ex: 55.00)"
                        className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(event) => updateForm('stock', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors focus:border-[#47d7c6]/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Image principale</label>
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(event) => updateForm('imageUrl', event.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                      Modèle 3D (.glb, .stl, .obj, .3mf)
                      <label className="cursor-pointer text-xs font-semibold text-[#47d7c6] hover:underline">
                        Parcourir
                        <input
                          type="file"
                          accept=".glb,.gltf,.stl,.obj,.3mf,model/gltf-binary"
                          className="hidden"
                          onChange={handleModel3DUpload}
                        />
                      </label>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.model3d.startsWith('data:') ? 'Fichier 3D importé (Base64)' : form.model3d}
                        onChange={(event) => {
                          if (event.target.value !== 'Fichier 3D importé (Base64)') {
                            updateForm('model3d', event.target.value);
                          }
                        }}
                        placeholder="URL ou fichier local"
                        className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 pr-10 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
                      />
                      {form.model3d.startsWith('data:') ? (
                        <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                      ) : (
                        <Box size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Couleurs disponibles</label>
                    <div className="flex flex-wrap gap-2">
                      {form.colors.split(',').map((c) => c.trim()).filter(Boolean).map((color, index) => {
                        const isHex = color.startsWith('#');
                        return (
                          <div key={index} className="flex items-center gap-1 rounded-full border border-white/10 bg-[#0b1118] p-1 pr-2">
                            <input
                              type="color"
                              value={isHex ? color : '#ffffff'}
                              onChange={(e) => updateColor(index, e.target.value)}
                              className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                            />
                            {!isHex && <span className="text-xs text-white">{color}</span>}
                            <button type="button" onClick={() => removeColor(index)} className="ml-1 text-slate-500 hover:text-red-400">
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                      <button type="button" onClick={addColor} className="flex items-center gap-1 rounded-full border border-dashed border-white/20 px-3 py-1 text-sm text-slate-400 hover:text-white">
                        <Plus size={14} /> Ajouter
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Matériaux disponibles (Séparés par virgule)</label>
                    <input
                      type="text"
                      value={form.materials}
                      onChange={(event) => updateForm('materials', event.target.value)}
                      placeholder="PLA Premium, PETG, Résine"
                      className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Parties colorables (Ex: 1, 2...)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={form.customizableParts}
                      onChange={(event) => updateForm('customizableParts', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors focus:border-[#47d7c6]/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Taille / Dimensions</label>
                    <input
                      type="text"
                      value={form.dimensions}
                      onChange={(event) => updateForm('dimensions', event.target.value)}
                      placeholder="Ex: 15 x 15 x 10 cm"
                      className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Poids</label>
                    <input
                      type="text"
                      value={form.weight}
                      onChange={(event) => updateForm('weight', event.target.value)}
                      placeholder="Ex: 150g ou Variable"
                      className="w-full rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    rows={6}
                    value={form.description}
                    onChange={(event) => updateForm('description', event.target.value)}
                    placeholder="Décrivez le produit, ses finitions, son usage et ses avantages."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-[#0b1118] px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#47d7c6]/50"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#0b1118] p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Upload size={16} />
                    Ajouter des images
                  </div>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center transition-colors hover:bg-white/[0.06]">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        void appendFiles(event.target.files);
                        event.target.value = '';
                      }}
                    />
                    <div className="rounded-full border border-white/10 bg-white/5 p-3 text-slate-300">
                      <ImageIcon size={20} />
                    </div>
                    <div className="mt-4 text-sm font-medium text-white">Importer des images</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">PNG, JPG, WEBP ou GIF. Les fichiers sont prévisualisés avant enregistrement.</p>
                  </label>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[#0b1118] p-5">
                  <div className="mb-3 text-sm font-medium text-slate-200">Prévisualisation</div>
                  {form.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {form.images.map((image, index) => (
                        <div key={`${image}-${index}`} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                          <img src={image} alt={`Aperçu ${index + 1}`} className="h-32 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition-colors hover:bg-black"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
                      Aucune image ajoutée
                    </div>
                  )}
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                  Le produit enregistré sera visible dans le catalogue avec sa première image comme image principale.
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={closeModal}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void saveProduct()}
                disabled={saving}
                className="w-full rounded-2xl bg-[#47d7c6] px-4 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Enregistrement...' : editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}