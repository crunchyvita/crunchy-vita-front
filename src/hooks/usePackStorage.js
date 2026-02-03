/**
 * usePackStorage Hook
 * 
 * Client-side hook for persisting and retrieving custom pack configurations
 * using browser localStorage without requiring user authentication or database.
 * 
 * Features:
 * - Automatic save on configuration changes
 * - Automatic restore on page load
 * - TTL (Time To Live) support for data expiration
 * - Multiple pack support (separate storage per packageId)
 * - Lightweight and secure (no sensitive data stored)
 */

import { useEffect, useState, useCallback } from 'react';

const STORAGE_PREFIX = 'crunchy_pack_';
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Custom hook to manage pack configuration storage
 * @param {string} packageId - Unique identifier for the package
 * @param {number} ttl - Time to live in milliseconds (default: 7 days)
 * @returns {Object} Storage methods and state
 */
export function usePackStorage(packageId, ttl = DEFAULT_TTL) {
  const [isStorageReady, setIsStorageReady] = useState(false);
  const storageKey = `${STORAGE_PREFIX}${packageId}`;

  /**
   * Check if localStorage is available
   */
  const isLocalStorageAvailable = useCallback(() => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return false;
    }
  }, []);

  useEffect(() => {
    setIsStorageReady(isLocalStorageAvailable());
  }, [isLocalStorageAvailable]);

  /**
   * Save pack configuration to localStorage
   * @param {Object} config - Pack configuration object
   * @param {Array} config.selectedProducts - Array of selected product IDs
   * @param {Object} config.quantities - Object mapping product IDs to quantities
   * @param {Object} config.packageData - Package metadata (optional)
   */
  const savePackConfig = useCallback((config) => {
    if (!isStorageReady || !packageId) return false;

    try {
      const dataToStore = {
        ...config,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        version: '1.0', // For future compatibility
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      return true;
    } catch (error) {
      console.error('Failed to save pack configuration:', error);
      return false;
    }
  }, [isStorageReady, packageId, storageKey, ttl]);

  /**
   * Load pack configuration from localStorage
   * @returns {Object|null} Stored configuration or null if not found/expired
   */
  const loadPackConfig = useCallback(() => {
    if (!isStorageReady || !packageId) return null;

    try {
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) return null;

      const parsedData = JSON.parse(storedData);
      
      // Check if data has expired
      if (parsedData.expiresAt && parsedData.expiresAt < Date.now()) {
        localStorage.removeItem(storageKey);
        return null;
      }

      // Return only the user configuration (exclude metadata)
      const { timestamp, expiresAt, version, ...config } = parsedData;
      return config;
    } catch (error) {
      console.error('Failed to load pack configuration:', error);
      // Remove corrupted data
      localStorage.removeItem(storageKey);
      return null;
    }
  }, [isStorageReady, packageId, storageKey]);

  /**
   * Clear pack configuration from localStorage
   */
  const clearPackConfig = useCallback(() => {
    if (!isStorageReady || !packageId) return false;

    try {
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear pack configuration:', error);
      return false;
    }
  }, [isStorageReady, packageId, storageKey]);

  /**
   * Check if pack configuration exists in storage
   */
  const hasStoredConfig = useCallback(() => {
    if (!isStorageReady || !packageId) return false;
    return localStorage.getItem(storageKey) !== null;
  }, [isStorageReady, packageId, storageKey]);

  /**
   * Get storage metadata (timestamp, expiration)
   */
  const getStorageMetadata = useCallback(() => {
    if (!isStorageReady || !packageId) return null;

    try {
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) return null;

      const parsedData = JSON.parse(storedData);
      return {
        timestamp: parsedData.timestamp,
        expiresAt: parsedData.expiresAt,
        version: parsedData.version,
        isExpired: parsedData.expiresAt < Date.now(),
      };
    } catch (error) {
      return null;
    }
  }, [isStorageReady, packageId, storageKey]);

  /**
   * Clear all expired pack configurations from localStorage
   */
  const clearExpiredConfigs = useCallback(() => {
    if (!isStorageReady) return 0;

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
      console.error('Failed to clear expired configurations:', error);
    }
    return clearedCount;
  }, [isStorageReady]);

  return {
    isStorageReady,
    savePackConfig,
    loadPackConfig,
    clearPackConfig,
    hasStoredConfig,
    getStorageMetadata,
    clearExpiredConfigs,
  };
}

export default usePackStorage;
