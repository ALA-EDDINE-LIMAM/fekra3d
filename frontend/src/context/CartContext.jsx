import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(undefined);

const normalizeCustomization = (product, customization = {}) => {
  const colors = Array.isArray(customization.colors)
    ? customization.colors.map((color) => String(color).trim()).filter(Boolean)
    : [];
  const material = customization.material ? String(customization.material).trim() : '';
  const customizableParts = Number.isFinite(Number(customization.customizableParts))
    ? Number(customization.customizableParts)
    : Number(product?.customizableParts) || colors.length || 1;

  return {
    colors,
    material,
    customizableParts,
  };
};

const buildCustomizationKey = (customization) => {
  const colors = Array.isArray(customization.colors) ? customization.colors : [];
  return `${colors.join('|')}::${customization.material || ''}::${customization.customizableParts || 1}`;
};

const createCartItemId = (productId, customization) => `${productId}::${buildCustomizationKey(customization)}`;

const normalizeStoredItem = (item) => {
  if (!item?.product?.id) {
    return null;
  }

  const customization = normalizeCustomization(item.product, item.customization || {});

  return {
    ...item,
    id: item.id || createCartItemId(item.product.id, customization),
    customization,
  };
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const savedCart = window.localStorage.getItem('fekra3d_cart');
    if (!savedCart) {
      return [];
    }

    try {
      const parsed = JSON.parse(savedCart);
      return Array.isArray(parsed) ? parsed.map(normalizeStoredItem).filter(Boolean) : [];
    } catch {
      window.localStorage.removeItem('fekra3d_cart');
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem('fekra3d_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1, customization = {}) => {
    const normalizedCustomization = normalizeCustomization(product, customization);
    const itemId = createCartItemId(product.id, normalizedCustomization);

    setItems((previousItems) => {
      const existingItem = previousItems.find((item) => item.id === itemId);
      if (existingItem) {
        return previousItems.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...previousItems, { id: itemId, product, quantity, customization: normalizedCustomization }];
    });
  };

  const removeFromCart = (itemId) => {
    setItems((previousItems) => previousItems.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
