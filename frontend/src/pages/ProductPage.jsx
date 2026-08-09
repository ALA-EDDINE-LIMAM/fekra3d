import React, { useState, Suspense, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useCart } from '../context/CartContext';
import { useProductById } from '../utils/products';
import { resolveMediaUrl } from '../services/api';
import '@google/model-viewer';
import { Box, Image as ImageIcon, Ruler, Scale, Layers, Star } from 'lucide-react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erreur de chargement du modèle 3D:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center space-y-4 px-6 text-center">
          <Box size={48} className="text-red-500 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Modèle non supporté ou invalide</h3>
          <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Le fichier importé n'a pas pu être lu. Assurez-vous d'utiliser un STL, OBJ ou 3MF valide.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function RawModel({ url, type, colors }) {
  const Loader = type === 'obj' ? OBJLoader : type === '3mf' ? ThreeMFLoader : STLLoader;
  const obj = useLoader(Loader, url);

  const geometry = useMemo(() => {
    if (type === 'stl') return obj;
    return null;
  }, [obj, type]);

  useMemo(() => {
    if (type === 'obj' || type === '3mf') {
      let meshIndex = 0;
      obj.traverse((child) => {
        if (child.isMesh) {
          const colorToApply = colors[meshIndex % colors.length] || colors[0];
          if (colorToApply) {
            if (!child.material.clone) return;
            child.material = child.material.clone();
            child.material.color.set(colorToApply);
          }
          meshIndex++;
        }
      });
    }
  }, [obj, type, colors]);

  if (type === 'stl') {
    return (
      <mesh geometry={geometry}>
        <meshStandardMaterial color={colors[0] || '#cbd5e1'} />
      </mesh>
    );
  }

  return <primitive object={obj} />;
}

function RawModelViewer({ url, colors }) {
  const lowerUrl = url?.toLowerCase() || '';
  const isObj = lowerUrl.endsWith('.obj') || lowerUrl.includes('model/obj');
  const is3mf = lowerUrl.endsWith('.3mf') || lowerUrl.includes('model/3mf');
  const type = isObj ? 'obj' : is3mf ? '3mf' : 'stl';

  return (
    <div className="h-[20rem] w-full bg-slate-100 dark:bg-[#0f172a] sm:h-[24rem]">
      <ErrorBoundary>
        <Canvas shadows camera={{ position: [0, 0, 150], fov: 50 }}>
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.5}>
              <RawModel url={url} type={type} colors={colors} />
            </Stage>
          </Suspense>
          <OrbitControls autoRotate />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

const hexToRgbaNormalized = (hex) => {
  if (!hex || typeof hex !== 'string') return [1, 1, 1, 1];
  let c = hex.trim();
  if (c.startsWith('#')) {
    c = c.substring(1);
  }
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  if (c.length === 6) {
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    return [r, g, b, 1.0];
  }
  return [1, 1, 1, 1];
};

function ProductGallery({ product, selectedColors }) {
  const resolvedImages = useMemo(() => {
    const gallery = Array.isArray(product?.images) ? product.images : [];
    const fallback = product?.image ?? product?.image_url ?? '';
    const nextImages = gallery.map(resolveMediaUrl).filter(Boolean);
    const primary = resolveMediaUrl(fallback) || nextImages[0] || '';

    return {
      mainImage: primary,
      galleryImages: nextImages.length > 0 ? nextImages : primary ? [primary] : [],
    };
  }, [product?.image, product?.image_url, product?.images]);

  const [mainImage, setMainImage] = useState(resolvedImages.mainImage);
  const [viewMode, setViewMode] = useState('2d');
  const modelViewerRef = useRef(null);

  const isUnsupportedFormat = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.stl') || lowerUrl.endsWith('.obj') || lowerUrl.endsWith('.3mf')) return true;
    if (lowerUrl.includes('model/stl') || lowerUrl.includes('model/obj') || lowerUrl.includes('model/3mf')) return true;
    // Octet-stream is often the mime type assigned by the browser when picking STL/OBJ/3MF files
    if (lowerUrl.startsWith('data:application/octet-stream') || lowerUrl.startsWith('data:text/plain')) return true;
    return false;
  };

  const modelUrl = product?.model3d;
  const unsupported = isUnsupportedFormat(modelUrl);

  useEffect(() => {
    setMainImage(resolvedImages.mainImage);
  }, [resolvedImages.mainImage]);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;

    const applyColors = () => {
      if (modelViewer.model && modelViewer.model.materials) {
        modelViewer.model.materials.forEach((material, index) => {
          const color = selectedColors[index % selectedColors.length] || selectedColors[0];
          if (color) {
            const rgba = hexToRgbaNormalized(color);
            material.pbrMetallicRoughness.setBaseColorFactor(rgba);
          }
        });
      }
    };

    modelViewer.addEventListener('load', applyColors);
    applyColors();

    return () => {
      modelViewer.removeEventListener('load', applyColors);
    };
  }, [selectedColors, viewMode]);

  return (
    <div className="mx-auto w-full max-w-[34rem] space-y-4">
      <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0c1420]">
        {viewMode === '3d' ? (
          unsupported ? (
            <RawModelViewer url={modelUrl} colors={selectedColors} />
          ) : (
            <model-viewer
              ref={modelViewerRef}
              src={modelUrl || "https://modelviewer.dev/shared-assets/models/Astronaut.glb"}
              camera-controls
              auto-rotate
              ar
              shadow-intensity="1"
              style={{ width: '100%', height: '24rem', backgroundColor: '#0f172a' }}
            ></model-viewer>
          )
        ) : (
          <div className="relative flex h-[20rem] w-full items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-950 sm:h-[24rem]">
            <img 
              src={mainImage} 
              alt="" 
              className="absolute inset-0 h-full w-full object-cover blur-md opacity-45 scale-110 pointer-events-none select-none" 
            />
            <img 
              src={mainImage} 
              alt={product.name} 
              className="relative z-10 h-full w-full object-contain" 
            />
          </div>
        )}

        {modelUrl && modelUrl.trim() !== '' && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/50 p-1 backdrop-blur-md">
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${viewMode === '2d' ? 'bg-[#47d7c6] text-slate-950' : 'text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20'}`}
            >
              <ImageIcon size={16} />
              Images
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${viewMode === '3d' ? 'bg-[#47d7c6] text-slate-950' : 'text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20'}`}
            >
              <Box size={16} />
              Vue 3D
            </button>
          </div>
        )}
      </div>

      {resolvedImages.galleryImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {resolvedImages.galleryImages.map((image, index) => (
            <button
              key={`${product.id}-${image}-${index}`}
              type="button"
              onClick={() => setMainImage(image)}
              className={`overflow-hidden rounded-2xl border p-1 transition-all ${mainImage === image ? 'border-[#47d7c6] bg-[#47d7c6]/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0c1420] hover:border-slate-350 dark:hover:border-white/20'}`}
            >
              <img src={image} alt={`${product.name} - Vue ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {resolvedImages.galleryImages.length > 1 ? (
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          {resolvedImages.galleryImages.length} image(s) disponible(s)
        </p>
      ) : null}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const product = useProductById(id);

  const customizablePartsCount = product?.customizableParts || 1;
  const availableColors = Array.isArray(product?.colors) ? product.colors.filter(Boolean) : [];
  const availableMaterials = Array.isArray(product?.materials) ? product.materials.filter(Boolean) : [];
  const [selectedColors, setSelectedColors] = useState(() => {
    return availableColors.length > 0
      ? Array.from({ length: customizablePartsCount }).map(() => availableColors[0])
      : [];
  });
  const [selectedMaterial, setSelectedMaterial] = useState(availableMaterials[0] ?? '');
  const selectedCustomization = useMemo(() => ({
    colors: selectedColors,
    material: selectedMaterial,
    customizableParts: customizablePartsCount,
  }), [selectedColors, selectedMaterial, customizablePartsCount]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setSelectedColors(
      availableColors.length > 0
        ? Array.from({ length: customizablePartsCount }).map(() => availableColors[0])
        : []
    );
    setSelectedMaterial(availableMaterials[0] ?? '');
  }, [product?.id]);

  if (!product) {
    return (
      <PageShell eyebrow="Produit" title="Produit introuvable" description="L'article demandé n'existe pas dans le catalogue.">
        <Link to="/catalogue" className="inline-flex rounded-xl bg-[#47d7c6] px-5 py-3 font-semibold text-slate-950">
          Retour au catalogue
        </Link>
      </PageShell>
    );
  }

  const technicalInfo = [
    { label: 'Matériau', value: selectedMaterial || 'Standard' },
    { label: 'Dimensions', value: product.dimensions || 'Standard' },
    { label: 'Poids', value: product.weight || 'Standard' },
    { label: 'Résolution', value: product.resolution || 'Standard' },
  ];

  return (
    <PageShell eyebrow="Produit" title={product.name} description={product.description}>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ProductGallery key={product.id} product={product} selectedColors={selectedColors} />
        <div className="glass-panel flex flex-col gap-6 p-6">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-slate-500">{product.category}</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {Number(product.price).toFixed(3)} <span className="text-sm font-semibold text-slate-500 dark:text-white/70">TND</span>
              </div>
              {product.originalPrice && (
                <div className="text-lg font-medium text-slate-400 line-through">
                  {Number(product.originalPrice).toFixed(3)} TND
                </div>
              )}
            </div>
          </div>

          {availableColors.length > 0 || availableMaterials.length > 0 ? (
            <div className="flex flex-col gap-6 border-y border-slate-200 dark:border-white/10 py-6">
              {availableColors.length > 0 ? (
                Array.from({ length: customizablePartsCount }).map((_, partIndex) => (
                  <div key={partIndex}>
                    <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-slate-550 dark:text-slate-400">
                      {customizablePartsCount > 1 ? `Couleur Partie ${partIndex + 1}` : 'Couleur'}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {availableColors.map((color) => {
                        const isHex = color.startsWith('#');
                        const isSelected = selectedColors[partIndex] === color;
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              const newColors = [...selectedColors];
                              newColors[partIndex] = color;
                              setSelectedColors(newColors);
                            }}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${isSelected ? 'border-[#47d7c6] bg-[#47d7c6]/10 text-slate-900 dark:text-white font-medium' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                          >
                            <span className="block h-4 w-4 rounded-full border border-slate-300 dark:border-white/20 shadow-inner" style={{ backgroundColor: isHex ? color : undefined }}>
                              {!isHex && <span className="sr-only">{color}</span>}
                            </span>
                            <span className="capitalize">{!isHex ? color : ''}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : null}

              {availableMaterials.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-slate-550 dark:text-slate-400">Matériau</h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {availableMaterials.map((material) => (
                      <button
                        key={material}
                        onClick={() => setSelectedMaterial(material)}
                        className={`rounded-xl border px-4 py-2 text-sm transition-all ${selectedMaterial === material ? 'border-[#47d7c6] bg-[#47d7c6]/10 text-slate-900 dark:text-white font-medium' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {product.features?.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Spécifications</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                {product.features.map((feature) => (
                  <li key={feature} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">{feature}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Infos Techniques</h3>
            <ul className="mt-4 space-y-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
              {technicalInfo.map((info) => (
                <li key={info.label} className="flex items-center gap-3 text-slate-750 dark:text-slate-300">
                  {info.label === 'Matériau' ? <Layers className="shrink-0 text-[#47d7c6]" size={18} /> : null}
                  {info.label === 'Dimensions' ? <Ruler className="shrink-0 text-[#47d7c6]" size={18} /> : null}
                  {info.label === 'Poids' ? <Scale className="shrink-0 text-[#47d7c6]" size={18} /> : null}
                  {info.label === 'Résolution' ? <Star className="shrink-0 text-[#47d7c6]" size={18} /> : null}
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{info.label}:</span>
                  <span className="text-sm">{info.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => addToCart(product, 1, selectedCustomization)}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#47d7c6] px-5 py-4 font-bold text-slate-950 transition-colors hover:bg-emerald-400"
          >
            Ajouter au panier
          </button>
        </div>
      </div>
    </PageShell>
  );
}
