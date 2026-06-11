import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import api from '../api/axios';

export default function BudgetPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formatting helpers
  const formatCurrency = (amount) => {
    return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const getMonthName = (date) => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch budgets and transactions in parallel
        const [budgetsRes, txRes] = await Promise.all([
          api.get('/budgets'),
          api.get('/transactions')
        ]);
        
        const userBudgets = budgetsRes.data || [];
        
        // Filter to get only expenses for the current month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const currentMonthExpenses = txRes.data.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return tx.type === 'EXPENSE' && 
                 txDate >= startOfMonth && 
                 txDate <= endOfMonth;
        });

        setBudgets(userBudgets);
        setTransactions(currentMonthExpenses);
      } catch (error) {
        console.error('Failed to fetch budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDate]);

  // Calculations
  const calculateCategorySpent = (categoryName) => {
    return transactions
      .filter(tx => tx.category === categoryName)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + calculateCategorySpent(b.category), 0);
  const overallProgress = totalBudget === 0 ? 0 : Math.min((totalSpent / totalBudget) * 100, 100);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '24px',
        paddingTop: '8px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 700, 
          color: '#ffffff', 
          letterSpacing: '-0.5px',
          margin: 0
        }}>Anggaran</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => changeMonth(-1)} style={{ 
            color: '#ffffff', 
            background: 'none', 
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ 
            color: '#ffffff', 
            fontWeight: 500, 
            fontSize: '13px', 
            width: '100px', 
            textAlign: 'center' 
          }}>
            {getMonthName(currentDate)}
          </span>
          <button onClick={() => changeMonth(1)} style={{ 
            color: '#ffffff', 
            background: 'none', 
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}>
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={() => navigate('/budget/settings')}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: '#1c1c1c',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Settings size={22} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '40vh' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <motion.div 
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Main Budget Card */}
          <div style={{
            background: 'linear-gradient(135deg, #6b7cff, #5b6cee)',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '8px',
            boxShadow: '0 8px 32px rgba(107, 124, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Anggaran</p>
                <h2 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, margin: 0 }}>{formatCurrency(totalBudget)}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Pengeluaran</p>
                <h2 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, margin: 0 }}>{formatCurrency(totalSpent)}</h2>
              </div>
            </div>
            
            {/* Main Progress Bar */}
            <div style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '9999px', overflow: 'hidden', width: '100%' }}>
              <motion.div 
                style={{ height: '100%', backgroundColor: '#ffffff', borderRadius: '9999px' }}
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Budget List */}
          {budgets.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 24px', 
              backgroundColor: '#141414', 
              borderRadius: '24px', 
              border: '1px solid #1a1a1a',
              marginTop: '12px' 
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
              <h3 style={{ color: '#ffffff', fontWeight: 500, marginBottom: '4px', fontSize: '15px' }}>Belum Ada Anggaran</h3>
              <p style={{ color: '#999999', fontSize: '13px' }}>Tekan tombol pengaturan (⚙️) di sudut kanan atas untuk mulai membuat anggaran Anda.</p>
            </div>
          ) : (
            budgets.map((budget) => {
              const spent = calculateCategorySpent(budget.category);
              const progressRaw = (spent / budget.amount) * 100;
              const progress = Math.min(progressRaw, 100);
              
              let barColor = '#22c55e'; // Green
              if (progressRaw >= 100) barColor = '#ff5577'; // Red
              else if (progressRaw >= 80) barColor = '#f59e0b'; // Yellow

              return (
                <div key={budget._id} style={{
                  backgroundColor: '#1c1c1f',
                  borderRadius: '24px',
                  padding: '20px',
                  border: '1px solid #2c2c2e'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#2c2c2e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0
                    }}>
                      {budget.icon}
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4px' }}>
                        <h3 style={{ color: '#ffffff', fontWeight: 500, fontSize: '15px', margin: 0 }}>{budget.category}</h3>
                        <p style={{ color: '#8e8e93', fontSize: '11px', fontWeight: 500, fontFamily: 'monospace', margin: 0 }}>
                          {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                        </p>
                      </div>
                      
                      {/* Category Progress Bar */}
                      <div style={{ height: '10px', backgroundColor: '#2c2c2e', borderRadius: '9999px', overflow: 'hidden', marginTop: '6px', width: '100%' }}>
                        <motion.div 
                          style={{ height: '100%', borderRadius: '9999px', backgroundColor: barColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      )}
    </div>
  );
}
