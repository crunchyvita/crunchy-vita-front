# Quick Start Guide: Pack Storage System

## 🚀 Get Started in 3 Steps

### Step 1: Import the Hook
```jsx
import { usePackStorage } from '@/hooks/usePackStorage';
```

### Step 2: Initialize in Your Component
```jsx
function MyPackPage() {
  const packageId = "your-package-id";
  const { savePackConfig, loadPackConfig, clearPackConfig } = usePackStorage(packageId);
  
  // Your component logic...
}
```

### Step 3: Use Auto-Save and Auto-Restore
```jsx
// Auto-restore on mount
useEffect(() => {
  const saved = loadPackConfig();
  if (saved) {
    setSelectedProducts(saved.selectedProducts);
    setQuantities(saved.quantities);
  }
}, [loadPackConfig]);

// Auto-save on changes
useEffect(() => {
  if (selectedProducts.length > 0) {
    savePackConfig({
      selectedProducts,
      quantities,
      packageData: { /* metadata */ }
    });
  }
}, [selectedProducts, quantities, savePackConfig]);
```

## ✅ That's It!

Your pack configurations will now:
- ✅ Automatically save when users make changes
- ✅ Automatically restore when users return
- ✅ Expire after 7 days
- ✅ Validate products on restore
- ✅ Work without authentication

## 📚 Need More?

- See [PACK_STORAGE_README.md](./PACK_STORAGE_README.md) for full documentation
- Check [packStorageExamples.js](./src/examples/packStorageExamples.js) for more examples

## 🎨 Add Visual Feedback (Optional)

```jsx
import StorageIndicator from '@/components/StorageIndicator';

function MyPackPage() {
  const [showIndicator, setShowIndicator] = useState(false);
  
  return (
    <>
      <StorageIndicator action="save" show={showIndicator} />
      {/* Your page content */}
    </>
  );
}
```

## 🧹 Cleanup Expired Data (Optional)

```jsx
import { clearExpiredPacks } from '@/lib/packStorageUtils';

// In your app initialization
useEffect(() => {
  clearExpiredPacks(); // Removes expired configurations
}, []);
```

## 🔧 Common Patterns

### Pattern 1: Clear on Checkout
```jsx
const handleCheckout = () => {
  clearPackConfig();
  router.push('/cart');
};
```

### Pattern 2: Reset Configuration
```jsx
const handleReset = () => {
  setSelectedProducts([]);
  clearPackConfig();
};
```

### Pattern 3: Check if Config Exists
```jsx
const { hasStoredConfig } = usePackStorage(packageId);

useEffect(() => {
  if (hasStoredConfig()) {
    // Show "Resume where you left off" message
  }
}, [hasStoredConfig]);
```

## 🎯 Live Example

The implementation is already active in:
- [/shop/packages/[id]](./src/app/shop/packages/[id]/page.jsx) ← Main integration

Try it:
1. Go to any package customization page
2. Select products
3. Refresh the page
4. Products remain selected! ✨

---

**Happy coding!** 🎉
