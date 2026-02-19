'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const isStockErrorMessage = (message) =>
  typeof message === 'string' && message.toLowerCase().includes('insufficient stock');

const getErrorMessage = (err) => {
  if (!err) return 'Something went wrong';
  if (typeof err === 'string') return err;
  return err.message || 'Something went wrong';
};

/**
 * Helper to make API requests with credentials and JWT token
 */
const cartAPI = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send cookies (guestId)
  };

  // Add JWT token from localStorage if user is logged in
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}/cart${endpoint}`, options);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error?.message || errorMessage;
    } catch {}
    const requestError = new Error(errorMessage);
    requestError.isStockError = isStockErrorMessage(errorMessage);
    throw requestError;
  }

  return await response.json();
};

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to load cart
  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await cartAPI('/', 'GET');
      if (result && result.success === false) {
        setError(result.message || 'Insufficient stock for this product');
        return;
      }
      setCartItems(result.data.items || []);
      setError(null);
    } catch (err) {
      const message = getErrorMessage(err);
      if (!isStockErrorMessage(message)) {
        console.error('Failed to load cart:', err);
      }
      setError(message);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cart from API on mount
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Listen for cart reload events (triggered on login/register)
  useEffect(() => {
    const handleCartReload = () => {
      console.log('Cart reload event received, reloading cart...');
      loadCart();
    };

    window.addEventListener('cartNeedsReload', handleCartReload);
    return () => window.removeEventListener('cartNeedsReload', handleCartReload);
  }, [loadCart]);

  // Add item to cart
  const addToCart = useCallback(
    async (product, quantity = 1) => {
      if (!product || !product._id) {
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        const isPackage = product.type === 'package' || !!product.packageId;
        
        const payload = {
          quantity: Math.max(1, parseInt(quantity) || 1),
          packageType: isPackage ? 'package' : 'product',
        };

        // Only include packageId if it's a package
        if (isPackage) {
          payload.packageId = product.packageId || product._id;
          payload.selectedProducts = product.selectedProducts || [];
        } else {
          // Only include productId if it's a product
          payload.productId = product._id;
        }

        const result = await cartAPI('/add', 'POST', payload);
        if (result && result.success === false) {
          setError(result.message || 'Insufficient stock for this product');
          return false;
        }
        setCartItems(result.data.items || []);
        setError(null);
        return true;
      } catch (err) {
        const message = getErrorMessage(err);
        if (!isStockErrorMessage(message)) {
          console.error('Failed to add to cart:', err);
        }
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId) => {
    try {
      setIsLoading(true);
      setError(null);

      // Find item by _id directly
      const item = cartItems.find((i) => i._id === itemId);

      if (!item || !item._id) {
        console.error('Item not found in cart');
        return;
      }

      const result = await cartAPI(`/items/${item._id}`, 'DELETE');
      setCartItems(result.data.items || []);
      setError(null);
    } catch (err) {
      console.error('Failed to remove from cart:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [cartItems]);

  // Update item quantity
  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      const nextQty = parseInt(quantity) || 0;

      if (nextQty <= 0) {
        await removeFromCart(itemId);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Find item by _id directly
        const item = cartItems.find((i) => i._id === itemId);

        if (!item || !item._id) {
          console.error('Item not found in cart');
          return;
        }

        const result = await cartAPI(`/items/${item._id}`, 'PUT', { quantity: nextQty });
        if (result && result.success === false) {
          setError(result.message || 'Insufficient stock for this product');
          return false;
        }
        setCartItems(result.data.items || []);
        setError(null);
        return true;
      } catch (err) {
        const message = getErrorMessage(err);
        if (!isStockErrorMessage(message)) {
          console.error('Failed to update quantity:', err);
        }
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [cartItems, removeFromCart]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await cartAPI('/', 'DELETE');
      setCartItems([]);
      setError(null);
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    return acc + price * quantity;
  }, 0);
  const shipping = cartItems.length > 0 ? 10 : 0;
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
    error,
  };
}
