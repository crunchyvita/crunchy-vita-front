'use client';

import { useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'crunchyVitaCart';

const pickUrl = (v) => {
  if (!v || v === 'undefined') return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.url || v.secure_url || null;
  return null;
};

// Helper to extract first image from product
const getProductImageUrl = (product) => {
  if (!product) return null;
  
  // Try media array first (get first image URL)
  if (product.media && product.media.length > 0) {
    const mediaItem = product.media[0];
    const url = mediaItem?.url || mediaItem;
    if (url && url !== 'undefined') return url;
  }
  
  // Fall back to other image fields
  const url = product.image || product.imageUrl || product.productImage;
  if (url && url !== 'undefined') return url;
  
  return null;
};

const isPackagePayload = (item) =>
  !!item &&
  (item.type === 'package' ||
    !!item.packageId ||
    (Array.isArray(item.selectedProducts) && item.selectedProducts.length > 0));

const getPackageImagesFromItem = (item) => {
  if (!isPackagePayload(item)) return [];

  let imgs = Array.isArray(item?.packageImages)
    ? item.packageImages.map(pickUrl).filter(Boolean)
    : [];

  if (imgs.length === 0 && Array.isArray(item?.selectedProducts)) {
    imgs = item.selectedProducts
      .map((sp) => {
        const direct = pickUrl(sp?.image);
        if (direct) return direct;

        const product = sp?.product || sp?.productId || null;
        if (!product) return null;

        return getProductImageUrl(product) || pickUrl(product?.image);
      })
      .filter(Boolean);
  }

  const seen = new Set();
  const unique = [];
  for (const u of imgs) {
    if (!seen.has(u)) {
      seen.add(u);
      unique.push(u);
    }
  }

  return unique;
};

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const normalized = Array.isArray(parsed)
            ? parsed.map((item) => {
                if (!isPackagePayload(item)) return item;

                const packageImages = getPackageImagesFromItem(item);
                if (packageImages.length === 0) return item;

                if (Array.isArray(item?.packageImages) && item.packageImages.length > 0) {
                  return item;
                }

                return {
                  ...item,
                  packageImages,
                };
              })
            : parsed;

          setCartItems(normalized);
        }
      } catch (err) {
        console.error('Failed to load cart from localStorage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (err) {
        console.error('Failed to save cart to localStorage:', err);
      }
    }
  }, [cartItems, isLoading]);

  // Add item to cart
  const addToCart = useCallback((product, quantity = 1) => {
    if (!product || !product._id) return;

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id);

      if (isPackagePayload(product)) {
        if (existingItem) {
          return prevItems.map((item) =>
            item._id === product._id
              ? { ...item, quantity: (item.quantity || 1) + quantity }
              : item
          );
        }

        return [
          ...prevItems,
          {
            ...product,
            quantity: product.quantity || quantity,
          },
        ];
      }

      if (existingItem) {
        // Update quantity if product already in cart
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        // Add new product to cart
        return [
          ...prevItems,
          {
            _id: product._id,
            name: product.name,
            price: product.price || 0,
            image: getProductImageUrl(product),
            quantity,
            product, // Store full product object for reference
          },
        ];
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId));
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = cartItems.length > 0 ? 10 : 0; // Simple shipping: €10 flat if items exist
  const total = subtotal + shipping;

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    shipping,
    total,
    itemCount: cartItems.length,
    isLoading,
  };
}
