/**
 * Pack Storage Utilities
 * 
 * Utility functions for managing pack configuration storage
 * across the application.
 */

const STORAGE_PREFIX = 'crunchy_pack_';

/**
 * Get all stored pack configurations
 * @returns {Array} Array of pack configurations with metadata
 */
export function getAllStoredPacks() {
  if (typeof window === 'undefined') return [];
  
  const packs = [];
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const packageId = key.replace(STORAGE_PREFIX, '');
          packs.push({
            packageId,
            ...data,
          });
        } catch (e) {
          console.error(`Failed to parse pack data for key: ${key}`, e);
        }
      }
    });
  } catch (error) {
    console.error('Failed to get stored packs:', error);
  }
  return packs;
}

/**
 * Clear all pack configurations from storage
 * @returns {number} Number of packs cleared
 */
export function clearAllPackConfigs() {
  if (typeof window === 'undefined') return 0;
  
  let clearedCount = 0;
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
  } catch (error) {
    console.error('Failed to clear pack configs:', error);
  }
  return clearedCount;
}

/**
 * Clear expired pack configurations
 * @returns {number} Number of expired packs cleared
 */
export function clearExpiredPacks() {
  if (typeof window === 'undefined') return 0;
  
  let clearedCount = 0;
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.expiresAt && data.expiresAt < Date.now()) {
            localStorage.removeItem(key);
            clearedCount++;
          }
        } catch (e) {
          // Remove corrupted entries
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    });
  } catch (error) {
    console.error('Failed to clear expired packs:', error);
  }
  return clearedCount;
}

/**
 * Get storage size for pack configurations
 * @returns {Object} Storage size information
 */
export function getPackStorageSize() {
  if (typeof window === 'undefined') return { bytes: 0, readable: '0 B' };
  
  let totalBytes = 0;
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        totalBytes += new Blob([key + value]).size;
      }
    });
  } catch (error) {
    console.error('Failed to calculate storage size:', error);
  }
  
  return {
    bytes: totalBytes,
    readable: formatBytes(totalBytes),
  };
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Export pack configuration as JSON file
 * @param {string} packageId - Package ID
 * @param {Object} config - Pack configuration
 */
export function exportPackConfig(packageId, config) {
  try {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pack_${packageId}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export pack config:', error);
  }
}

/**
 * Check localStorage quota usage
 * @returns {Object} Quota information
 */
export function checkStorageQuota() {
  if (typeof window === 'undefined') return null;
  
  try {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage.getItem(key).length + key.length;
      }
    }
    
    // Most browsers have ~5-10MB limit for localStorage
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    const usagePercent = (totalSize / estimatedLimit) * 100;
    
    return {
      used: totalSize,
      usedReadable: formatBytes(totalSize),
      estimatedLimit,
      estimatedLimitReadable: formatBytes(estimatedLimit),
      usagePercent: Math.round(usagePercent * 100) / 100,
    };
  } catch (error) {
    console.error('Failed to check storage quota:', error);
    return null;
  }
}
