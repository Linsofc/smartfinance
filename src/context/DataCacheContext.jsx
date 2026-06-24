import { createContext, useContext, useCallback, useRef, useState } from 'react';
import api from '../api/axios';

const DataCacheContext = createContext(null);

// Cache TTL in milliseconds (2 minutes â€” data is "fresh" for this long)
const CACHE_TTL = 2 * 60 * 1000;

/**
 * Centralized in-memory data cache for SmartFinance.
 * 
 * Pattern: Stale-While-Revalidate
 * - If cached data exists and is fresh â†’ return instantly, no network call
 * - If cached data exists but is stale â†’ return instantly, refresh silently in background
 * - If no cached data â†’ fetch from network, show loading
 * - On any mutation (add/update/delete) â†’ invalidate related caches
 */
export function DataCacheProvider({ children }) {
  // Cache store: { [cacheKey]: { data, timestamp, promise? } }
  const cacheRef = useRef(new Map());

  // Store active promises to deduplicate concurrent requests: { [cacheKey]: Promise }
  const activeRequestsRef = useRef(new Map());

  // We use a version counter to force re-renders when cache is updated
  const [cacheVersion, setCacheVersion] = useState(0);
  const bumpVersion = () => setCacheVersion(v => v + 1);

  // â”€â”€â”€ Generic Cache Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getCacheEntry = useCallback((key) => {
    return cacheRef.current.get(key) || null;
  }, []);

  const setCacheEntry = useCallback((key, data) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() });
    bumpVersion();
  }, []);

  const isFresh = useCallback((key) => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;
    return (Date.now() - entry.timestamp) < CACHE_TTL;
  }, []);

  const invalidateCache = useCallback((keyOrPrefix) => {
    if (typeof keyOrPrefix === 'string') {
      // Invalidate all keys that start with this prefix
      for (const key of cacheRef.current.keys()) {
        if (key.startsWith(keyOrPrefix)) {
          cacheRef.current.delete(key);
        }
      }
    }
    bumpVersion();
  }, []);

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
    bumpVersion();
  }, []);

  // â”€â”€â”€ Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchTransactions = useCallback(async (month, year, opts = {}) => {
    const key = `transactions:${month}:${year}`;
    const cached = getCacheEntry(key);

    // Return cached data if fresh (skip network)
    if (cached && isFresh(key) && !opts.force) {
      return cached.data;
    }

    // Return active promise if already in flight to deduplicate concurrent requests
    if (activeRequestsRef.current.has(key)) {
      return activeRequestsRef.current.get(key);
    }

    const promise = (async () => {
      try {
        const res = await api.get('/transactions', { params: { month, year } });
        setCacheEntry(key, res.data);
        return res.data;
      } catch (error) {
        // If we have stale cache, return it on error
        if (cached) return cached.data;
        throw error;
      } finally {
        activeRequestsRef.current.delete(key);
      }
    })();

    activeRequestsRef.current.set(key, promise);
    return promise;
  }, [getCacheEntry, isFresh, setCacheEntry]);

  const addTransaction = useCallback(async (data) => {
    const res = await api.post('/transactions', data);
    invalidateCache('transactions:');
    invalidateCache('all_transactions');
    invalidateCache('analytics:');
    invalidateCache('wallets'); // Transactions may affect wallet balance
    return res.data;
  }, [invalidateCache]);

  const updateTransaction = useCallback(async (id, data) => {
    const res = await api.put(`/transactions/${id}`, data);
    invalidateCache('transactions:');
    invalidateCache('all_transactions');
    invalidateCache('analytics:');
    invalidateCache('wallets');
    return res.data;
  }, [invalidateCache]);

  const deleteTransaction = useCallback(async (id) => {
    const res = await api.delete(`/transactions/${id}`);
    invalidateCache('transactions:');
    invalidateCache('all_transactions');
    invalidateCache('analytics:');
    invalidateCache('wallets');
    return res.data;
  }, [invalidateCache]);

  // â”€â”€â”€ Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchAnalytics = useCallback(async (year, opts = {}) => {
    const key = `analytics:${year}`;
    const cached = getCacheEntry(key);

    if (cached && isFresh(key) && !opts.force) {
      return cached.data;
    }

    if (activeRequestsRef.current.has(key)) {
      return activeRequestsRef.current.get(key);
    }

    const promise = (async () => {
      try {
        const res = await api.get('/transactions/analytics', { params: { year } });
        setCacheEntry(key, res.data);
        return res.data;
      } catch (error) {
        if (cached) return cached.data;
        throw error;
      } finally {
        activeRequestsRef.current.delete(key);
      }
    })();

    activeRequestsRef.current.set(key, promise);
    return promise;
  }, [getCacheEntry, isFresh, setCacheEntry]);

  // â”€â”€â”€ Wallets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchWallets = useCallback(async (opts = {}) => {
    const key = 'wallets';
    const cached = getCacheEntry(key);

    if (cached && isFresh(key) && !opts.force) {
      return cached.data;
    }

    if (activeRequestsRef.current.has(key)) {
      return activeRequestsRef.current.get(key);
    }

    const promise = (async () => {
      try {
        const res = await api.get('/wallets');
        setCacheEntry(key, res.data);
        return res.data;
      } catch (error) {
        if (cached) return cached.data;
        throw error;
      } finally {
        activeRequestsRef.current.delete(key);
      }
    })();

    activeRequestsRef.current.set(key, promise);
    return promise;
  }, [getCacheEntry, isFresh, setCacheEntry]);

  const createWallet = useCallback(async (data) => {
    const res = await api.post('/wallets', data);
    invalidateCache('wallets');
    return res.data;
  }, [invalidateCache]);

  const updateWallet = useCallback(async (id, data) => {
    const res = await api.put(`/wallets/${id}`, data);
    invalidateCache('wallets');
    invalidateCache('transactions:'); // Wallet name may appear in transaction list
    return res.data;
  }, [invalidateCache]);

  const deleteWallet = useCallback(async (id) => {
    const res = await api.delete(`/wallets/${id}`);
    invalidateCache('wallets');
    return res.data;
  }, [invalidateCache]);

  // â”€â”€â”€ Transfers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchTransfers = useCallback(async (opts = {}) => {
    const key = 'transfers';
    const cached = getCacheEntry(key);

    if (cached && isFresh(key) && !opts.force) {
      return cached.data;
    }

    if (activeRequestsRef.current.has(key)) {
      return activeRequestsRef.current.get(key);
    }

    const promise = (async () => {
      try {
        const res = await api.get('/transfers');
        setCacheEntry(key, res.data);
        return res.data;
      } catch (error) {
        if (cached) return cached.data;
        throw error;
      } finally {
        activeRequestsRef.current.delete(key);
      }
    })();

    activeRequestsRef.current.set(key, promise);
    return promise;
  }, [getCacheEntry, isFresh, setCacheEntry]);

  const createTransfer = useCallback(async (data) => {
    const res = await api.post('/transfers', data);
    invalidateCache('transfers');
    invalidateCache('wallets'); // Transfers affect wallet balances
    return res.data;
  }, [invalidateCache]);

  // â”€â”€â”€ Budgets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchBudgets = useCallback(async (opts = {}) => {
    const key = 'budgets';
    const cached = getCacheEntry(key);

    if (cached && isFresh(key) && !opts.force) {
      return cached.data;
    }

    if (activeRequestsRef.current.has(key)) {
      return activeRequestsRef.current.get(key);
    }

    const promise = (async () => {
      try {
        const res = await api.get('/budgets');
        setCacheEntry(key, res.data);
        return res.data;
      } catch (error) {
        if (cached) return cached.data;
        throw error;
      } finally {
        activeRequestsRef.current.delete(key);
      }
    })();

    activeRequestsRef.current.set(key, promise);
    return promise;
  }, [getCacheEntry, isFresh, setCacheEntry]);

  const createBudget = useCallback(async (data) => {
    const res = await api.post('/budgets', data);
    invalidateCache('budgets');
    return res.data;
  }, [invalidateCache]);

  const deleteBudget = useCallback(async (id) => {
    const res = await api.delete(`/budgets/${id}`);
    invalidateCache('budgets');
    return res.data;
  }, [invalidateCache]);

  // â”€â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchCategories = useCallback(async (opts = {}) => {
    const key = 'categories';
    const cached = getCacheEntry(key);

    if (cached && isFresh(key) && !opts.force) {
      return cached.data;
    }

    if (activeRequestsRef.current.has(key)) {
      return activeRequestsRef.current.get(key);
    }

    const promise = (async () => {
      try {
        const res = await api.get('/auth/categories');
        setCacheEntry(key, res.data);
        return res.data;
      } catch (error) {
        if (cached) return cached.data;
        throw error;
      } finally {
        activeRequestsRef.current.delete(key);
      }
    })();

    activeRequestsRef.current.set(key, promise);
    return promise;
  }, [getCacheEntry, isFresh, setCacheEntry]);

  const addCustomCategory = useCallback(async (categoryData) => {
    const res = await api.post('/auth/categories', categoryData);
    invalidateCache('categories');
    return res.data;
  }, [invalidateCache]);

  // â”€â”€â”€ Fetch All Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchAllTransactions = useCallback(async (opts = {}) => {
    const key = 'all_transactions';
    const cached = getCacheEntry(key);

    if (cached && isFresh(key) && !opts.force) {
      return cached.data;
    }

    if (activeRequestsRef.current.has(key)) {
      return activeRequestsRef.current.get(key);
    }

    const promise = (async () => {
      try {
        const res = await api.get('/transactions');
        setCacheEntry(key, res.data);
        return res.data;
      } catch (error) {
        if (cached) return cached.data;
        throw error;
      } finally {
        activeRequestsRef.current.delete(key);
      }
    })();

    activeRequestsRef.current.set(key, promise);
    return promise;
  }, [getCacheEntry, isFresh, setCacheEntry]);

  return (
    <DataCacheContext.Provider value={{
      // Version for reactivity
      cacheVersion,
      // Cache control
      invalidateCache,
      clearAllCache,
      getCacheEntry,
      isFresh,
      // Transactions
      fetchTransactions,
      fetchAllTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      // Analytics
      fetchAnalytics,
      // Wallets
      fetchWallets,
      createWallet,
      updateWallet,
      deleteWallet,
      // Transfers
      fetchTransfers,
      createTransfer,
      // Budgets
      fetchBudgets,
      createBudget,
      deleteBudget,
      // Categories
      fetchCategories,
      addCustomCategory,
    }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
}
