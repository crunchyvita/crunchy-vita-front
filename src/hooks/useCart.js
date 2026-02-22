'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
    requestError.status = response.status;
    requestError.isStockError = isStockErrorMessage(errorMessage);
    throw requestError;
  }

  return await response.json();
};

const getProductAvailableStock = async (productId) => {
  if (!productId) return null;

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_URL}/products/${productId}/stock`, options);
    if (!response.ok) return null;
    const result = await response.json();
    const stock = result?.data || result;
    if (!stock) return null;
    
    // ✅ Return BOTH total quantity and available quantity for validation
    const totalQuantity = Number(stock.quantity || 0);
    let availableQuantity = 0;
    
    if (stock.availableQuantity !== undefined && stock.availableQuantity !== null) {
      availableQuantity = Number(stock.availableQuantity) || 0;
    } else {
      const reserved = Number(stock.reservedQuantity || 0);
      availableQuantity = Math.max(0, totalQuantity - reserved);
    }
    
    return {
      quantity: availableQuantity,
      quantityTotal: totalQuantity,
      reserved: Number(stock.reservedQuantity || 0),
      availableQuantity: availableQuantity
    };
  } catch {
    return null;
  }
};

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockAlertTick, setStockAlertTick] = useState(0);

  const pendingQuantityUpdatesRef = useRef(new Map());
  const pendingRemoveRef = useRef(new Map());
  const optimisticQuantitiesRef = useRef(new Map());
  const lastUpdateTimeRef = useRef(new Map()); // Track last successful update time per item
  const lastAddTimeRef = useRef(new Map()); // Track last successful add time per product

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

  useEffect(() => {
    const next = new Map();
    for (const item of cartItems) {
      if (item?._id) next.set(item._id, item.quantity || 0);
    }
    optimisticQuantitiesRef.current = next;
  }, [cartItems]);

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
  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!product || !product._id) return false;

    // ✅ CHECK COOLDOWN: 1 second throttle per product
    const productKey = product.packageId || product._id;
    const lastAddTime = lastAddTimeRef.current.get(productKey) || 0;
    const timeSinceLastAdd = Date.now() - lastAddTime;
    if (timeSinceLastAdd < 1000) {
      // Still in cooldown, block the add
      return false;
    }

    // ✅ RECORD TIME IMMEDIATELY
    lastAddTimeRef.current.set(productKey, Date.now());

    try {
      setIsLoading(true);
      setError(null);

      const isPackage = product.type === 'package' || !!product.packageId;

      const payload = {
        quantity: Math.max(1, parseInt(quantity) || 1),
        packageType: isPackage ? 'package' : 'product',
      };

      if (isPackage) {
        payload.packageId = product.packageId || product._id;
        payload.selectedProducts = product.selectedProducts || [];
      } else {
        payload.productId = product._id;
      }

      const result = await cartAPI('/add', 'POST', payload);
      if (result && result.success === false) {
        const message = result.message || 'Insufficient stock for this product';
        setError(message);
        if (isStockErrorMessage(message)) setStockAlertTick((prev) => prev + 1);
        return false;
      }

      setCartItems(result.data.items || []);
      setError(null);
      return true;
    } catch (err) {
      const message = getErrorMessage(err);
      if (!isStockErrorMessage(message)) console.error('Failed to add to cart:', err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback(
    async (itemId) => {
      if (!itemId) return false;

      setCartItems((prev) => prev.filter((item) => item._id !== itemId));
      setError(null);
      optimisticQuantitiesRef.current.delete(itemId);

      const existing = pendingRemoveRef.current.get(itemId);
      if (existing?.inFlight) return true;

      try {
        const requestId = (existing?.requestId || 0) + 1;
        pendingRemoveRef.current.set(itemId, { inFlight: true, requestId });

        const result = await cartAPI(`/items/${itemId}`, 'DELETE');
        const latest = pendingRemoveRef.current.get(itemId);
        if (!latest || latest.requestId !== requestId) return true;
        setCartItems(result.data.items || []);
        setError(null);
        return true;
      } catch (err) {
        const message = getErrorMessage(err);
        const isAlreadyRemoved =
          err?.status === 404 &&
          typeof message === 'string' &&
          message.toLowerCase().includes('cart item not found');

        if (isAlreadyRemoved) {
          setError(null);
          return true;
        }

        console.error('Failed to remove from cart:', err);
        setError(message);
        await loadCart();
        return false;
      } finally {
        const latest = pendingRemoveRef.current.get(itemId);
        if (latest?.requestId) pendingRemoveRef.current.delete(itemId);
      }
    },
    [loadCart]
  );

  // Update item quantity (✅ HARD BLOCK at max; no rollback visual)
  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      const requestedQty = parseInt(quantity) || 0;

      const item = cartItems.find((i) => i._id === itemId);
      if (!item || !item._id) {
        console.error('Item not found in cart');
        return false;
      }

      const currentQty = optimisticQuantitiesRef.current.get(itemId) ?? item.quantity ?? 0;

      // ✅ Cooldown only for '+' (quantity increase): 0.5 second per item
      if (requestedQty > currentQty) {
        const lastUpdateTime = lastUpdateTimeRef.current.get(itemId) || 0;
        const timeSinceLastUpdate = Date.now() - lastUpdateTime;
        if (timeSinceLastUpdate < 500) {
          return false;
        }
        lastUpdateTimeRef.current.set(itemId, Date.now());
      }

      if (requestedQty <= 0) {
        await removeFromCart(itemId);
        return false;
      }

      const existingSequence = pendingQuantityUpdatesRef.current.get(itemId)?.sequence || 0;
      const sequence = existingSequence + 1;
      pendingQuantityUpdatesRef.current.set(itemId, {
        ...pendingQuantityUpdatesRef.current.get(itemId),
        sequence,
      });

      // ✅ FINAL qty we will apply (may be clamped)
      let finalQty = requestedQty;

      // ✅ When increasing quantity, ALWAYS fetch fresh stock for validation
      if (finalQty > (currentQty || 0)) {
        if (item.type === 'product') {
          // ✅ Fetch latest stock (never trust cart snapshot)
          const productId = typeof item.productId === 'string' ? item.productId : item.productId?._id;
          const freshStock = await getProductAvailableStock(productId);

          if (pendingQuantityUpdatesRef.current.get(itemId)?.sequence !== sequence) {
            return true;
          }

          if (freshStock !== null) {
            // ✅ CORRECT FORMULA: maxAllowed = product total quantity (absolute max for any single item)
            // This prevents one cart item from exceeding total product inventory
            const maxAllowed = freshStock.quantityTotal || freshStock.quantity || 0;

            if (finalQty > maxAllowed) {
              finalQty = maxAllowed;
              if (finalQty === currentQty) {
                // ✅ Already at max, block and notify
                setStockAlertTick((prev) => prev + 1);
                return false;
              }
            }
          }
        } else if (item.type === 'package' && Array.isArray(item.selectedProducts)) {
          // ✅ For packages: validate each selected product can support the increase
          let maxQtyAllowed = Infinity;

          for (const selectedProduct of item.selectedProducts) {
            const spProductId = typeof selectedProduct.productId === 'string' 
              ? selectedProduct.productId 
              : selectedProduct.productId?._id;
            if (!spProductId) continue;

            const freshStock = await getProductAvailableStock(spProductId);
            if (pendingQuantityUpdatesRef.current.get(itemId)?.sequence !== sequence) {
              return true;
            }
            if (freshStock !== null) {
              // Each selected product in package has a qty factor
              const qtyPerSelection = selectedProduct.quantity || 1;
              const maxQtyForThisProduct = Math.floor((freshStock.quantityTotal || freshStock.quantity || 0) / qtyPerSelection);
              maxQtyAllowed = Math.min(maxQtyAllowed, maxQtyForThisProduct);
            }
          }

          if (maxQtyAllowed !== Infinity && finalQty > maxQtyAllowed) {
            finalQty = maxQtyAllowed;
            if (finalQty === currentQty) {
              // ✅ Already at max, block and notify
              setStockAlertTick((prev) => prev + 1);
              return false;
            }
          }
        }
      }

      // ✅ If no change after clamp, do nothing (prevents flicker + useless requests)
      if (finalQty === currentQty) return true;

      // ✅ optimistic UI update with finalQty
      setCartItems((prev) => prev.map((x) => (x._id === itemId ? { ...x, quantity: finalQty } : x)));
      setError(null);
      optimisticQuantitiesRef.current.set(itemId, finalQty);

      try {
        const existing = pendingQuantityUpdatesRef.current.get(itemId);
        if (existing?.sequence !== sequence) return true;
        if (existing?.timeoutId) clearTimeout(existing.timeoutId);

        // ✅ Debounce BOTH product and package updates; keep only the last request
        const requestId = sequence;
        const timeoutId = setTimeout(async () => {
          try {
            const result = await cartAPI(`/items/${item._id}`, 'PUT', { quantity: finalQty });
            const latest = pendingQuantityUpdatesRef.current.get(itemId);
            if (!latest || latest.requestId !== requestId || latest.sequence !== sequence) return;

            if (result && result.success === false) {
              const message = result.message || 'Insufficient stock for this product';
              setError(message);
              if (isStockErrorMessage(message)) setStockAlertTick((prev) => prev + 1);
              await loadCart();
              return;
            }

            setCartItems(result.data.items || []);
            setError(null);
          } catch (err) {
            const message = getErrorMessage(err);
            if (!isStockErrorMessage(message)) console.error('Failed to update quantity:', err);
            setError(message);
            await loadCart();
          } finally {
            const latest = pendingQuantityUpdatesRef.current.get(itemId);
            if (latest?.requestId === requestId && latest.sequence === sequence) {
              pendingQuantityUpdatesRef.current.delete(itemId);
            }
          }
        }, 1000);

        pendingQuantityUpdatesRef.current.set(itemId, { timeoutId, requestId, sequence });
        return true;
      } catch (err) {
        const message = getErrorMessage(err);
        if (!isStockErrorMessage(message)) console.error('Failed to update quantity:', err);
        setError(message);
        return false;
      }
    },
    [cartItems, removeFromCart, loadCart]
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
    stockAlertTick, // keep this since CartPage listens to it
  };
}