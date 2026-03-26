'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Toggle2, Loader2, Save, Package as PackageIcon } from 'lucide-react';
import AdminHeader from '@/components/admin/header';

// Neutral gray gradient placeholders for items without images
const PLACEHOLDER_GRADIENTS = [
  ['#F3F4F6', '#E5E7EB'],
  ['#ECEFF1', '#D1D5DB'],
  ['#F8FAFC', '#E6E6E6'],
  ['#F7F7F8', '#EDEDED'],
  ['#F2F4F7', '#D9D9D9'],
];

export default function PreferredItemAdminPage() {
  const [items, setItems] = useState([]);
  const [preferredItem, setPreferredItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState('');
  const [isBestSellerEnabled, setIsBestSellerEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Fetch available items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/preferred-item/available-items`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (result.success) {
          setItems(result.data);
        }
      } catch (err) {
        setError('Failed to fetch items');
      }
    };

    // Fetch current preferred item
    const fetchPreferredItem = async () => {
      try {
        const response = await fetch(`${API_URL}/preferred-item`);
        const result = await response.json();
        if (result.success && result.data) {
          setPreferredItem(result.data);
          setSelectedItem(result.data.itemId);
          setIsBestSellerEnabled(result.data.isBestSellerEnabled);
        }
      } catch (err) {
        console.error('Error fetching preferred item:', err);
      }
    };

    fetchItems();
    fetchPreferredItem();
  }, []);

  const handleSave = async () => {
    try {
      // Validate: if best seller is disabled, require manual selection
      if (!isBestSellerEnabled) {
        if (!selectedItem || selectedItem === '') {
          setError('Please select an item when Best Seller is disabled');
          return;
        }
      }

      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const selectedItemObj = selectedItem ? items.find(item => item._id === selectedItem) : null;

      // Validate item was found
      if (!isBestSellerEnabled && !selectedItemObj) {
        setError('Selected item not found in list');
        setLoading(false);
        return;
      }

      // Debug log
      console.log('Sending data:', {
        itemId: selectedItem || null,
        itemType: selectedItemObj?.type || null,
        isBestSellerEnabled,
      });

      const response = await fetch(`${API_URL}/preferred-item/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId: selectedItem || null,
          itemType: selectedItemObj?.type || null,
          isBestSellerEnabled,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        setError(`Server Error (${response.status}): ${errorText || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('Response data:', result);
      
      if (result.success) {
        setSuccess('Preferred item updated successfully!');
        setPreferredItem(result.data);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorMsg = result.message || 'Failed to update preferred item';
        setError(' ' + errorMsg);
        console.error('Error response:', result);
      }
    } catch (err) {
      const errorMsg = err.message || 'Error saving preferred item';
      setError( errorMsg);
      console.error('Catch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBestSeller = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      
      // Toggle the state
      const newBestSellerState = !isBestSellerEnabled;
      setIsBestSellerEnabled(newBestSellerState);
      
      // Prepare payload based on mode
      let payload;
      if (newBestSellerState) {
        // Enabling Best Seller: send null values for auto-detection
        payload = {
          itemId: null,
          itemType: null,
          isBestSellerEnabled: true,
        };
      } else {
        // Disabling Best Seller: allow null if no item selected yet
        const selectedItemObj = selectedItem ? items.find(item => item._id === selectedItem) : null;
        payload = {
          itemId: selectedItemObj ? selectedItem : null,
          itemType: selectedItemObj ? selectedItemObj.type : null,
          isBestSellerEnabled: false,
        };
      }
      
      console.log('Toggle Best Seller - Sending payload:', payload);
      
      const saveResponse = await fetch(`${API_URL}/preferred-item/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('Toggle Best Seller - Response status:', saveResponse.status);
      
      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('Toggle Best Seller - Error response:', errorText);
        setError(`Erreur ${saveResponse.status}: ${errorText}`);
        setIsBestSellerEnabled(!newBestSellerState); // Revert on error
        setLoading(false);
        return;
      }

      const saveResult = await saveResponse.json();
      console.log('Toggle Best Seller - Success result:', saveResult);
      if (saveResult.success) {
        setSuccess(`Best seller ${newBestSellerState ? 'activé' : 'désactivé'} avec succès!`);
        setTimeout(() => setSuccess(''), 3000);
        
        // Fetch the updated preferred item (with best-seller if enabled)
        const prefResponse = await fetch(`${API_URL}/preferred-item`);
        const prefResult = await prefResponse.json();
        if (prefResult.success && prefResult.data) {
          setPreferredItem(prefResult.data);
          setSelectedItem(prefResult.data.itemId || '');
        }
      } else {
        setError(saveResult.message || 'Échec de la mise à jour');
        setIsBestSellerEnabled(!newBestSellerState); // Revert on error
      }
    } catch (err) {
      setError('Erreur lors du basculement du best seller');
      setIsBestSellerEnabled(!isBestSellerEnabled); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const selectedItemData = items.find(item => item._id === selectedItem);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        {/* Header Section */}
        <div className="w-full">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              Preferred Item
              
            </h1>
            <p className="mt-1 text-sm text-slate-500">Configure which product or package to feature as preferred</p>
          </div>
          
          {/* Best Seller Toggle in Header */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleToggleBestSeller}
              disabled={loading}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isBestSellerEnabled ? 'bg-[#556822]' : 'bg-slate-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isBestSellerEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <p className="text-xs text-gray-600 font-semibold max-w-xs text-right">
              {isBestSellerEnabled ? ' Auto Best Seller' : 'Manual Selection'}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      <div>
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 text-green-700">
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        <div className="space-y-8">
          {/* Products Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              Products
              {isBestSellerEnabled && (
                <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            
                </span>
              )}
            </h2>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {items
                .filter(item => item.type === 'PRODUCT')
                .filter(item => {
                  if (!isBestSellerEnabled) return true;
                  if (!preferredItem) return false;
                  // For auto best seller, compare with preferredItem._id (the detected best seller's id)
                  // For manual selection, compare with preferredItem.itemId (the manually selected id)
                  const bestSellerId = preferredItem.itemId || preferredItem._id;
                  return item._id === bestSellerId;
                })
                .map(item => (
                <button
                  key={item._id}
                  onClick={() => !isBestSellerEnabled && setSelectedItem(item._id)}
                  disabled={isBestSellerEnabled}
                  className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                    selectedItem === item._id || (isBestSellerEnabled && preferredItem && (item._id === preferredItem.itemId || item._id === preferredItem._id))
                      ? 'ring-4 ring-[#556822] shadow-xl scale-105'
                      : 'hover:shadow-lg hover:scale-102'
                  } ${isBestSellerEnabled ? 'cursor-default' : ''}`}
                >
                  {/* Best Seller Badge */}
                  {isBestSellerEnabled && preferredItem && (item._id === preferredItem.itemId || item._id === preferredItem._id) && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
                     best seller
                    </div>
                  )}
                  
                  {/* Card Background */}
                  <div className={`w-full aspect-square rounded-xl overflow-hidden ${
                    selectedItem === item._id || (isBestSellerEnabled && preferredItem && item._id === preferredItem.itemId) ? 'bg-[#f5f7ee]' : 'bg-white'
                  } border-2 ${selectedItem === item._id || (isBestSellerEnabled && preferredItem && item._id === preferredItem.itemId) ? 'border-[#556822]' : 'border-gray-200'} transition-all`}>
                    
                    {/* Image or placeholder icon */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      (() => {
                        const idx = item._id ? item._id.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length : 0;
                        const [c1, c2] = PLACEHOLDER_GRADIENTS[idx];
                        return (
                          <div
                            className="w-full h-full flex items-center justify-center overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                          >
                            <div className="flex flex-col items-center gap-1 text-white">
                              <div className="rounded-lg bg-white/10 p-4 shadow-inner">
                                <PackageIcon size={48} strokeWidth={1.5} />
                              </div>
                              <span className="text-xs font-semibold mt-2 text-white/90">{item.name}</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                      <p className="text-white font-bold text-xs line-clamp-2">{item.name}</p>
                      <p className="text-gray-200 text-xs">Product</p>
                    </div>
                  </div>
                  
                  {/* Selection Badge */}
                  {(selectedItem === item._id || (isBestSellerEnabled && preferredItem && item._id === preferredItem.itemId)) && (
                    <div className="absolute top-2 right-2 bg-[#556822] text-white rounded-full p-2 shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Packages Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">

              Packages
              {isBestSellerEnabled && (
                <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                
                </span>
              )}
            </h2>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {items
                .filter(item => item.type === 'PACKAGE')
                .filter(item => {
                  if (!isBestSellerEnabled) return true;
                  if (!preferredItem) return false;
                  // For auto best seller, compare with preferredItem._id (the detected best seller's id)
                  // For manual selection, compare with preferredItem.itemId (the manually selected id)
                  const bestSellerId = preferredItem.itemId || preferredItem._id;
                  return item._id === bestSellerId;
                })
                .map(item => (
                <button
                  key={item._id}
                  onClick={() => !isBestSellerEnabled && setSelectedItem(item._id)}
                  disabled={isBestSellerEnabled}
                  className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                    selectedItem === item._id || (isBestSellerEnabled && preferredItem && (item._id === preferredItem.itemId || item._id === preferredItem._id))
                      ? 'ring-4 ring-[#556822] shadow-xl scale-105'
                      : 'hover:shadow-lg hover:scale-102'
                  } ${isBestSellerEnabled ? 'cursor-default' : ''}`}
                >
                  {/* Best Seller Badge */}
                  {isBestSellerEnabled && preferredItem && (item._id === preferredItem.itemId || item._id === preferredItem._id) && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
                      <span>⭐</span> BEST SELLER
                    </div>
                  )}
                  
                  {/* Card Background */}
                  <div className={`w-full aspect-square rounded-xl overflow-hidden ${
                    selectedItem === item._id || (isBestSellerEnabled && preferredItem && (item._id === preferredItem.itemId || item._id === preferredItem._id)) ? 'bg-[#f5f7ee]' : 'bg-white'
                  } border-2 ${selectedItem === item._id || (isBestSellerEnabled && preferredItem && (item._id === preferredItem.itemId || item._id === preferredItem._id)) ? 'border-[#556822]' : 'border-gray-200'} transition-all`}>
                    
                    {/* Image */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      (() => {
                        const idx = item._id ? item._id.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length : 0;
                        const [c1, c2] = PLACEHOLDER_GRADIENTS[idx];
                        return (
                          <div
                            className="w-full h-full flex items-center justify-center overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                          >
                            <div className="flex flex-col items-center gap-1 text-white">
                              <div className="rounded-lg bg-white/10 p-4 shadow-inner">
                                <PackageIcon size={48} strokeWidth={1.5} />
                              </div>
                              <span className="text-xs font-semibold mt-2 text-white/90">{item.name}</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                      <p className="text-white font-bold text-xs line-clamp-2">{item.name}</p>
                      <p className="text-gray-200 text-xs">Package</p>
                    </div>
                  </div>
                  
                  {/* Selection Badge */}
                  {(selectedItem === item._id || (isBestSellerEnabled && preferredItem && (item._id === preferredItem.itemId || item._id === preferredItem._id))) && (
                    <div className="absolute top-2 right-2 bg-[#556822] text-white rounded-full p-2 shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

        

          {/* Save Button - Only show in manual mode */}
          {!isBestSellerEnabled && (
            <div className="flex gap-4 flex-col md:flex-row">
              <button
                onClick={handleSave}
                disabled={loading || !selectedItem}
                className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-4 px-8 rounded-lg transition-colors disabled:cursor-not-allowed text-lg shadow-lg"
                style={{
                  backgroundColor: loading || !selectedItem ? '#cccccc' : '#556822'
                }}
                onMouseEnter={(e) => (loading || !selectedItem) || (e.target.style.backgroundColor = '#3d4617', e.target.style.boxShadow = '0 10px 25px rgba(85, 102, 34, 0.3)')}
                onMouseLeave={(e) => (loading || !selectedItem) || (e.target.style.backgroundColor = '#556822', e.target.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)')}
                title={!selectedItem ? 'Please select an item first' : ''}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Enregistrer la Sélection
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
    </div>
  );
}

