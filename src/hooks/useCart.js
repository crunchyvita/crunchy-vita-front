'use client';

import { useState, useEffect, useCallback } from 'react';
import { stockAPI } from '@/lib/api';

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

const normalizeProductId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value._id || value.id || null;
  return null;
};

const buildReservationLines = (item, packageMultiplier = 1) => {
  if (!item) return [];

  if (!isPackagePayload(item)) {
    const productId = normalizeProductId(item._id);
    return productId ? [{ productId, quantity: packageMultiplier }] : [];
  }

  const linesByProduct = new Map();
  const selected = Array.isArray(item.selectedProducts) ? item.selectedProducts : [];

  for (const sp of selected) {
    const productId = normalizeProductId(sp?.productId || sp?.product || sp?._id);
    if (!productId) continue;

    const baseQty = Number(sp?.quantity || 1);
    const lineQty = Math.max(0, baseQty) * packageMultiplier;
    if (!lineQty) continue;

    linesByProduct.set(productId, (linesByProduct.get(productId) || 0) + lineQty);
  }

  return Array.from(linesByProduct, ([productId, quantity]) => ({ productId, quantity }));
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

  const reserveLines = useCallback(async (lines) => {
    const reserved = [];

    for (const line of lines) {
      try {
        await stockAPI.reserve(line.productId, line.quantity);
        reserved.push(line);
      } catch (err) {
        if (reserved.length > 0) {
          await Promise.all(
            reserved.map((r) => stockAPI.release(r.productId, r.quantity).catch(() => null))
          );
        }
        throw err;
      }
    }
  }, []);

  const releaseLines = useCallback(async (lines) => {
    await Promise.all(
      lines.map((line) => stockAPI.release(line.productId, line.quantity).catch(() => null))
    );
  }, []);

  // Add item to cart
  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!product || !product._id) return false;

    const existingItem = cartItems.find((item) => item._id === product._id);
    const deltaQty = Number(quantity) || 1;
    const reservationItem = existingItem || product;
    const lines = buildReservationLines(reservationItem, deltaQty);

    try {
      await reserveLines(lines);
    } catch (err) {
      console.error('Failed to reserve stock:', err);
      return false;
    }

    setCartItems((prevItems) => {
      const prevExisting = prevItems.find((item) => item._id === product._id);

      if (isPackagePayload(product)) {
        if (prevExisting) {
          return prevItems.map((item) =>
            item._id === product._id
              ? { ...item, quantity: (item.quantity || 1) + deltaQty }
              : item
          );
        }

        return [
          ...prevItems,
          {
            ...product,
            quantity: product.quantity || deltaQty,
          },
        ];
      }

      if (prevExisting) {
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + deltaQty } : item
        );
      }

      return [
        ...prevItems,
        {
          _id: product._id,
          name: product.name,
          price: product.price || 0,
          image: getProductImageUrl(product),
          quantity: deltaQty,
          product,
        },
      ];
    });

    return true;
  }, [cartItems, reserveLines]);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    const item = cartItems.find((entry) => entry._id === productId);
    if (item) {
      const lines = buildReservationLines(item, Number(item.quantity || 1));
      await releaseLines(lines);
    }

    setCartItems((prevItems) => prevItems.filter((entry) => entry._id !== productId));
  }, [cartItems, releaseLines]);

  // Update item quantity
  const updateQuantity = useCallback(async (productId, quantity) => {
    const nextQty = Number(quantity) || 0;
    const item = cartItems.find((entry) => entry._id === productId);
    if (!item) return;

    if (nextQty <= 0) {
      await removeFromCart(productId);
      return;
    }

    const currentQty = Number(item.quantity || 1);
    const delta = nextQty - currentQty;
    if (delta === 0) return;

    const lines = buildReservationLines(item, Math.abs(delta));

    if (delta > 0) {
      try {
        await reserveLines(lines);
      } catch (err) {
        console.error('Failed to reserve stock:', err);
        return;
      }
    } else {
      await releaseLines(lines);
    }

    setCartItems((prevItems) =>
      prevItems.map((entry) =>
        entry._id === productId ? { ...entry, quantity: nextQty } : entry
      )
    );
  }, [cartItems, removeFromCart, releaseLines, reserveLines]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    const lines = cartItems.flatMap((item) =>
      buildReservationLines(item, Number(item.quantity || 1))
    );
    if (lines.length > 0) {
      await releaseLines(lines);
    }
    setCartItems([]);
  }, [cartItems, releaseLines]);

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
