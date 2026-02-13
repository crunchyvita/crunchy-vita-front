'use client';

import { useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'crunchyVitaCart';

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

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          setCartItems(JSON.parse(stored));
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
