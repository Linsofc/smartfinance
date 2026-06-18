import { createContext, useContext, useState, useCallback } from 'react';
import { useDataCache } from './DataCacheContext';

const TransactionContext = createContext(null);

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const cache = useDataCache();

  const fetchTransactions = useCallback(async (month, year) => {
    // Check if we have cached data — if so, set it instantly (no loading spinner)
    const key = `transactions:${month}:${year}`;
    const cached = cache.getCacheEntry(key);
    
    if (cached) {
      // Instantly show cached data — no loading state
      setTransactions(cached.data.transactions);
      setSummary(cached.data.summary);
      
      // If still fresh, skip network call entirely
      if (cache.isFresh(key)) {
        return cached.data;
      }
      
      // Stale cache — silently refresh in background (no loading spinner)
      try {
        const data = await cache.fetchTransactions(month, year, { force: true });
        setTransactions(data.transactions);
        setSummary(data.summary);
        return data;
      } catch {
        // Keep stale data on error
        return cached.data;
      }
    }

    // No cache at all — show loading
    setLoading(true);
    try {
      const data = await cache.fetchTransactions(month, year);
      setTransactions(data.transactions);
      setSummary(data.summary);
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const fetchAnalytics = useCallback(async (year) => {
    const key = `analytics:${year}`;
    const cached = cache.getCacheEntry(key);
    
    if (cached) {
      setAnalytics(cached.data);
      if (cache.isFresh(key)) return cached.data;

      try {
        const data = await cache.fetchAnalytics(year, { force: true });
        setAnalytics(data);
        return data;
      } catch {
        return cached.data;
      }
    }

    setLoading(true);
    try {
      const data = await cache.fetchAnalytics(year);
      setAnalytics(data);
      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const addTransaction = useCallback(async (data) => {
    try {
      const result = await cache.addTransaction(data);
      return result;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, [cache]);

  const updateTransaction = useCallback(async (id, data) => {
    try {
      const result = await cache.updateTransaction(id, data);
      return result;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }, [cache]);

  const deleteTransaction = useCallback(async (id) => {
    try {
      const result = await cache.deleteTransaction(id);
      return result;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }, [cache]);

  return (
    <TransactionContext.Provider value={{
      transactions,
      summary,
      analytics,
      loading,
      fetchTransactions,
      fetchAnalytics,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
