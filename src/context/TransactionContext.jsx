import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const TransactionContext = createContext(null);

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async (month, year) => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', { params: { month, year } });
      setTransactions(res.data.transactions);
      setSummary(res.data.summary);
      return res.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (year) => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/analytics', { params: { year } });
      setAnalytics(res.data);
      return res.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (data) => {
    try {
      const res = await api.post('/transactions', data);
      return res.data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, []);

  const updateTransaction = useCallback(async (id, data) => {
    try {
      const res = await api.put(`/transactions/${id}`, data);
      return res.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    try {
      const res = await api.delete(`/transactions/${id}`);
      return res.data;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }, []);

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
