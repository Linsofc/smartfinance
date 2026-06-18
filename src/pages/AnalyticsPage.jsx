import { useState, useEffect, useMemo } from 'react';
import { motion as motionFramer, AnimatePresence as AnimatePresenceFramer } from 'framer-motion';
import { 
  Tag, Wallet, Eye, EyeOff, 
  ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, 
  PieChart as PieChartIcon, BarChart3, Clock 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useDataCache } from '../context/DataCacheContext';
import api from '../api/axios';

const CHART_COLORS = [
  '#ff7a3d', '#6a4cf5', '#d44df0', '#1890ff', '#1e9045',
  '#ff5577', '#f59e0b', '#10b981', '#8b5cf6'
];

function formatRupiahFull(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();

  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const getPeriodDates = (period) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  let start = new Date();
  start.setHours(0, 0, 0, 0);
  
  let end = new Date(today);

  if (period === '7days') {
    start.setDate(today.getDate() - 6);
  } else if (period === '30days') {
    start.setDate(today.getDate() - 29);
  } else if (period === 'thisMonth') {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (period === 'lastMonth') {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === 'thisYear') {
    start = new Date(today.getFullYear(), 0, 1);
  }
  
  return { start, end };
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-hairline rounded-2xl px-3 py-2 shadow-xl">
        <p className="text-xs font-semibold text-ink mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs font-semibold tabular-nums" style={{ color: entry.color }}>
            {entry.name}: {formatRupiahFull(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const cache = useDataCache();
  
  // Data States
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [period, setPeriod] = useState('30days');
  const [startDate, setStartDate] = useState(() => {
    const { start } = getPeriodDates('30days');
    return formatDateForInput(start);
  });
  const [endDate, setEndDate] = useState(() => {
    const { end } = getPeriodDates('30days');
    return formatDateForInput(end);
  });
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedWallets, setSelectedWallets] = useState([]);
  
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isWalletSheetOpen, setIsWalletSheetOpen] = useState(false);

  // Fetch all transactions and wallets on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // GET /transactions returns all transactions without month/year query params
        const res = await api.get('/transactions');
        setTransactions(res.data.transactions || []);
        
        const walletData = await cache.fetchWallets();
        setWallets(walletData?.wallets || walletData || []);
      } catch (error) {
        console.error('Failed to load transactions for analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [cache]);

  // Handle Period Change event
  const handlePeriodChange = (val) => {
    setPeriod(val);
    if (val !== 'custom') {
      const { start, end } = getPeriodDates(val);
      setStartDate(formatDateForInput(start));
      setEndDate(formatDateForInput(end));
    }
  };

  // Collect unique categories dynamically
  const allCategories = useMemo(() => {
    const cats = new Set();
    transactions.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    if (cats.size === 0) {
      return ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Utilitas', 'Pendidikan', 'Tabungan', 'Hadiah'];
    }
    return Array.from(cats);
  }, [transactions]);

  // Filter Transactions based on UI filters
  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      
      // Date Check
      if (tDate < start || tDate > end) return false;
      
      // Category Check
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;
      
      // Wallet Check
      if (selectedWallets.length > 0) {
        if (!t.walletId) return false;
        const wId = typeof t.walletId === 'object' ? t.walletId._id : t.walletId;
        if (!selectedWallets.includes(wId)) return false;
      }
      
      return true;
    });
  }, [transactions, startDate, endDate, selectedCategories, selectedWallets]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const incomeTx = filteredTransactions.filter(t => t.type === 'INCOME');
    const expenseTx = filteredTransactions.filter(t => t.type === 'EXPENSE');

    const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    // Savings calculation
    const savingsPercent = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;
    
    let savingsStatus = 'CUKUP';
    if (savingsPercent >= 30) {
      savingsStatus = 'SANGAT BAIK';
    } else if (savingsPercent >= 10) {
      savingsStatus = 'BAIK';
    } else if (savingsPercent <= 0) {
      savingsStatus = 'DEFISIT';
    }

    return {
      totalIncome,
      incomeCount: incomeTx.length,
      totalExpense,
      expenseCount: expenseTx.length,
      balance,
      savingsPercent,
      savingsStatus
    };
  }, [filteredTransactions]);

  // Generate Date List for Daily Trend
  const dateList = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const list = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Safety cap
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 366) return [];

    const current = new Date(start);
    while (current <= end) {
      list.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return list;
  }, [startDate, endDate]);

  // Trend Chart Data
  const trendChartData = useMemo(() => {
    if (dateList.length === 0) return [];
    
    let runningSaldo = 0;
    
    return dateList.map(date => {
      const dayStr = date.toISOString().split('T')[0];
      const dayTransactions = filteredTransactions.filter(t => {
        const tDateStr = new Date(t.date).toISOString().split('T')[0];
        return tDateStr === dayStr;
      });
      
      const income = dayTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
      
      runningSaldo += (income - expense);
      const dayLabel = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      return {
        name: dayLabel,
        Pemasukan: income,
        Pengeluaran: expense,
        Saldo: runningSaldo
      };
    });
  }, [dateList, filteredTransactions]);

  // Pie Chart Data: Expenses by Category
  const categoryChartData = useMemo(() => {
    const expenseTx = filteredTransactions.filter(t => t.type === 'EXPENSE');
    const categorySums = {};
    
    expenseTx.forEach(t => {
      if (!categorySums[t.category]) {
        categorySums[t.category] = 0;
      }
      categorySums[t.category] += t.amount;
    });

    return Object.entries(categorySums)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const totalExpenseForPie = useMemo(() => {
    return categoryChartData.reduce((sum, c) => sum + c.value, 0);
  }, [categoryChartData]);

  // Bar Chart Data: Expense by Day of Week
  const barChartDayData = useMemo(() => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const amounts = [0, 0, 0, 0, 0, 0, 0];
    
    const expenseTx = filteredTransactions.filter(t => t.type === 'EXPENSE');
    expenseTx.forEach(t => {
      const tDate = new Date(t.date);
      let dayIndex = tDate.getDay() - 1; // getDay() is 0 (Sunday) to 6 (Saturday)
      if (dayIndex === -1) dayIndex = 6; // Sunday becomes index 6
      amounts[dayIndex] += t.amount;
    });
    
    return days.map((name, i) => ({
      name,
      Jumlah: amounts[i]
    }));
  }, [filteredTransactions]);

  // Day Stats
  const dayStats = useMemo(() => {
    let highestDay = '-';
    let highestAmount = 0;
    let lowestAmount = Infinity;
    let lowestDay = '-';
    
    const expenseTx = filteredTransactions.filter(t => t.type === 'EXPENSE');
    if (expenseTx.length === 0) {
      return { highestDay: '-', highestAmount: 0, lowestAmount: 0, lowestDay: '-' };
    }
    
    barChartDayData.forEach(item => {
      if (item.Jumlah > highestAmount) {
        highestAmount = item.Jumlah;
        highestDay = item.name;
      }
      if (item.Jumlah < lowestAmount) {
        lowestAmount = item.Jumlah;
        lowestDay = item.name;
      }
    });
    
    if (lowestAmount === Infinity) lowestAmount = 0;
    
    return { highestDay, highestAmount, lowestDay, lowestAmount };
  }, [barChartDayData, filteredTransactions]);

  // Bar Chart Data: Expense by Time of Day
  const barChartTimeData = useMemo(() => {
    const periods = ['Pagi', 'Siang', 'Sore', 'Malam'];
    const amounts = [0, 0, 0, 0];
    
    const expenseTx = filteredTransactions.filter(t => t.type === 'EXPENSE');
    expenseTx.forEach(t => {
      const tDate = new Date(t.date);
      const hour = tDate.getHours();
      
      if (hour >= 6 && hour < 12) {
        amounts[0] += t.amount; // Pagi (06:00 - 12:00)
      } else if (hour >= 12 && hour < 17) {
        amounts[1] += t.amount; // Siang (12:00 - 17:00)
      } else if (hour >= 17 && hour < 21) {
        amounts[2] += t.amount; // Sore (17:00 - 21:00)
      } else {
        amounts[3] += t.amount; // Malam (21:00 - 06:00)
      }
    });
    
    return periods.map((name, i) => ({
      name,
      Jumlah: amounts[i]
    }));
  }, [filteredTransactions]);

  // Time Stats
  const timeStats = useMemo(() => {
    let highestPeriod = '-';
    let highestAmount = 0;
    
    const expenseTx = filteredTransactions.filter(t => t.type === 'EXPENSE');
    if (expenseTx.length === 0) {
      return { highestPeriod: '-', totalExpense: 0 };
    }
    
    const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    barChartTimeData.forEach(item => {
      if (item.Jumlah > highestAmount) {
        highestAmount = item.Jumlah;
        highestPeriod = item.name;
      }
    });
    
    return { highestPeriod, totalExpense };
  }, [barChartTimeData, filteredTransactions]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ink-muted border-t-accent-blue rounded-full animate-spin" />
          <p className="text-ink-muted text-xs font-semibold">Memuat analisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-12 pb-24 px-4 overflow-y-auto no-scrollbar relative bg-[#f8fafc]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-extrabold text-ink tracking-tight">
          Analisis Keuangan
        </h1>
        <p className="text-ink-muted text-xs mt-1">
          Analisa pengeluaran, pemasukan, dan pola keuangan Anda.
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-3xl p-5 border border-hairline mb-6 flex flex-col gap-4 shadow-sm">
        {/* Collapsible content */}
        <AnimatePresenceFramer>
          {!isFiltersCollapsed && (
            <motionFramer.div 
              className="flex flex-col gap-4 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {/* Periode Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">Periode</label>
                <select
                  value={period}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-full bg-slate-50 border border-hairline rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-accent-blue transition-colors"
                >
                  <option value="7days">7 hari terakhir</option>
                  <option value="30days">30 hari terakhir</option>
                  <option value="thisMonth">Bulan ini</option>
                  <option value="lastMonth">Bulan lalu</option>
                  <option value="thisYear">Tahun ini</option>
                  <option value="custom">Kustom</option>
                </select>
              </div>

              {/* Rentang Tanggal inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    disabled={period !== 'custom'}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-hairline rounded-2xl px-3 py-3 text-xs font-semibold text-ink focus:outline-none focus:border-accent-blue transition-colors disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">Selesai</label>
                  <input
                    type="date"
                    value={endDate}
                    disabled={period !== 'custom'}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-hairline rounded-2xl px-3 py-3 text-xs font-semibold text-ink focus:outline-none focus:border-accent-blue transition-colors disabled:opacity-60"
                  />
                </div>
              </div>
            </motionFramer.div>
          )}
        </AnimatePresenceFramer>

        {/* Filter tags buttons row */}
        <div className="flex items-center gap-2 pt-1 border-t border-hairline-soft mt-1">
          <button
            onClick={() => setIsCategorySheetOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border text-xs font-semibold transition-all ${
              selectedCategories.length > 0 
                ? 'border-accent-blue bg-accent-blue/5 text-accent-blue' 
                : 'border-hairline bg-slate-50 text-ink-muted hover:bg-slate-100'
            }`}
          >
            <Tag size={12} />
            <span>Kategori {selectedCategories.length > 0 ? `(${selectedCategories.length})` : ''}</span>
          </button>

          <button
            onClick={() => setIsWalletSheetOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border text-xs font-semibold transition-all ${
              selectedWallets.length > 0 
                ? 'border-accent-blue bg-accent-blue/5 text-accent-blue' 
                : 'border-hairline bg-slate-50 text-ink-muted hover:bg-slate-100'
            }`}
          >
            <Wallet size={12} />
            <span>Dompet {selectedWallets.length > 0 ? `(${selectedWallets.length})` : ''}</span>
          </button>

          <button
            onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
            className="ml-auto flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border border-hairline bg-slate-50 text-ink-muted text-xs font-semibold hover:bg-slate-100 transition-all"
          >
            {isFiltersCollapsed ? (
              <>
                <Eye size={12} />
                <span>Tampilkan</span>
              </>
            ) : (
              <>
                <EyeOff size={12} />
                <span>Sembunyikan</span>
              </>
            )}
          </button>
        </div>

        {/* Info label banner */}
        <div className="flex items-center gap-2 bg-slate-50 border border-hairline-soft rounded-2xl px-4 py-3 text-[11px] font-semibold text-ink-muted">
          <Clock size={12} className="text-slate-400" />
          <span>
            Menampilkan <strong className="text-ink">{filteredTransactions.length} transaksi</strong> • {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Metrics Row (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* PENGHEMATAN */}
        <div className="bg-white rounded-3xl p-4 border border-hairline flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <span className="text-[9px] font-extrabold tracking-wider text-ink-muted uppercase">Penghematan</span>
            <h4 className="text-xl font-black text-ink mt-1 tracking-tight">
              {metrics.savingsPercent.toFixed(1)}%
            </h4>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] font-bold text-ink-muted">{metrics.savingsStatus}</span>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
        </div>

        {/* MASUK */}
        <div className="bg-white rounded-3xl p-4 border border-hairline flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <span className="text-[9px] font-extrabold tracking-wider text-ink-muted uppercase text-success">Masuk</span>
            <h4 className="text-lg font-black text-success mt-1 tracking-tight truncate">
              {formatRupiahFull(metrics.totalIncome)}
            </h4>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] font-bold text-ink-muted">{metrics.incomeCount} tx</span>
            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
              <ArrowUpRight size={14} className="text-success" />
            </div>
          </div>
        </div>

        {/* KELUAR */}
        <div className="bg-white rounded-3xl p-4 border border-hairline flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <span className="text-[9px] font-extrabold tracking-wider text-ink-muted uppercase text-danger">Keluar</span>
            <h4 className="text-lg font-black text-danger mt-1 tracking-tight truncate">
              {formatRupiahFull(metrics.totalExpense)}
            </h4>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] font-bold text-ink-muted">{metrics.expenseCount} tx</span>
            <div className="w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center">
              <ArrowDownRight size={14} className="text-danger" />
            </div>
          </div>
        </div>

        {/* SELISIH */}
        <div className="bg-white rounded-3xl p-4 border border-hairline flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <span className="text-[9px] font-extrabold tracking-wider text-ink-muted uppercase">Selisih</span>
            <h4 className={`text-lg font-black mt-1 tracking-tight truncate ${metrics.balance >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatRupiahFull(metrics.balance)}
            </h4>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] font-bold text-ink-muted">
              {metrics.balance >= 0 ? 'SURPLUS' : 'DEFISIT'}
            </span>
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
              <DollarSign size={14} className="text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Stack */}
      <div className="flex flex-col gap-6">
        {/* Distribusi Pengeluaran (Pie Chart) */}
        <div className="bg-white rounded-3xl p-5 border border-hairline shadow-sm">
          <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
            <PieChartIcon size={16} className="text-accent-blue" />
            Distribusi Pengeluaran
          </h3>
          
          {categoryChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
              <PieChartIcon size={44} className="opacity-20 mb-3" />
              <p className="text-xs font-semibold">Belum ada data pengeluaran untuk ditampilkan</p>
            </div>
          ) : (
            <>
              <div className="h-48 w-full relative min-h-[192px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {categoryChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatRupiahFull(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-hairline-soft">
                {categoryChartData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-[11px] text-ink-muted truncate flex-1">{cat.name}</span>
                    <span className="text-[11px] font-bold text-ink tabular-nums shrink-0">
                      {totalExpenseForPie > 0 ? `${((cat.value / totalExpenseForPie) * 100).toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tren Transaksi (Line Chart) */}
        <div className="bg-white rounded-3xl p-5 border border-hairline shadow-sm">
          <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-accent-blue" />
            Tren Transaksi
          </h3>

          {trendChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
              <TrendingUp size={44} className="opacity-20 mb-3" />
              <p className="text-xs font-semibold">Belum ada data transaksi untuk ditampilkan</p>
            </div>
          ) : (
            <>
              <div className="h-48 w-full relative min-h-[192px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 9, fill: '#94a3b8' }} 
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                        return val;
                      }}
                      width={38}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legends inline indicator */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-hairline-soft">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                  <span className="text-[10px] font-bold text-ink-muted">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                  <span className="text-[10px] font-bold text-ink-muted">Pengeluaran</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                  <span className="text-[10px] font-bold text-ink-muted">Saldo</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pengeluaran per Hari (Bar Chart) */}
        <div className="bg-white rounded-3xl p-5 border border-hairline shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <BarChart3 size={16} className="text-accent-blue" />
              Pengeluaran per Hari
            </h3>
            <p className="text-[11px] text-ink-muted mt-0.5">Identifikasi pola pengeluaran berdasarkan hari</p>
          </div>

          <div className="my-4">
            {metrics.totalExpense === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
                <BarChart3 size={44} className="opacity-20 mb-3" />
                <p className="text-xs font-semibold">Belum ada data pengeluaran</p>
              </div>
            ) : (
              <div className="h-44 w-full relative min-h-[176px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartDayData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis 
                      tick={{ fontSize: 9, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                        return val;
                      }}
                      width={38}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Jumlah" name="Pengeluaran" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-hairline-soft text-[11px] text-ink-muted flex flex-col gap-1.5 font-semibold">
            <div className="flex justify-between items-center">
              <span>Hari dengan pengeluaran tertinggi:</span>
              <strong className="text-ink">{dayStats.highestDay} {dayStats.highestAmount > 0 ? `(${formatRupiahFull(dayStats.highestAmount)})` : ''}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Pengeluaran terendah pada hari:</span>
              <strong className="text-ink">{dayStats.lowestDay} {dayStats.lowestAmount > 0 && dayStats.lowestAmount !== Infinity ? `(${formatRupiahFull(dayStats.lowestAmount)})` : '(Rp0)'}</strong>
            </div>
          </div>
        </div>

        {/* Pengeluaran Berdasarkan Waktu (Bar Chart) */}
        <div className="bg-white rounded-3xl p-5 border border-hairline shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Clock size={16} className="text-accent-blue" />
              Pengeluaran Berdasarkan Waktu
            </h3>
            <p className="text-[11px] text-ink-muted mt-0.5">Distribusi pengeluaran berdasarkan waktu hari</p>
          </div>

          <div className="my-4">
            {metrics.totalExpense === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
                <Clock size={44} className="opacity-20 mb-3" />
                <p className="text-xs font-semibold">Belum cukup data untuk ditampilkan</p>
              </div>
            ) : (
              <div className="h-44 w-full relative min-h-[176px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartTimeData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis 
                      tick={{ fontSize: 9, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                        return val;
                      }}
                      width={38}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Jumlah" name="Pengeluaran" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-hairline-soft text-[11px] text-ink-muted flex flex-col gap-1.5 font-semibold">
            <div className="flex justify-between items-center">
              <span>Total pengeluaran:</span>
              <strong className="text-ink">{formatRupiahFull(timeStats.totalExpense)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Waktu pengeluaran terbanyak:</span>
              <strong className="text-ink uppercase">{timeStats.highestPeriod}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Category Selection Bottom Sheet */}
      <AnimatePresenceFramer>
        {isCategorySheetOpen && (
          <motionFramer.div 
            className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.4)', 
              backdropFilter: 'blur(8px)', 
              WebkitBackdropFilter: 'blur(8px)' 
            }}
            onClick={() => setIsCategorySheetOpen(false)}
          >
            <motionFramer.div 
              className="w-full max-w-[480px] rounded-t-[24px] border-t px-6 pt-3 pb-8 flex flex-col bg-white border-hairline max-h-[70vh]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />
              
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-lg font-heading font-bold text-ink">Pilih Kategori</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedCategories([])} 
                    className="text-xs font-semibold text-accent-blue"
                  >
                    Semua
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 pb-4">
                {allCategories.map(cat => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedCategories(prev => prev.filter(c => c !== cat));
                        } else {
                          setSelectedCategories(prev => [...prev, cat]);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition-colors text-left ${
                        isChecked 
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold' 
                          : 'border-hairline bg-slate-50 text-ink-muted'
                      }`}
                    >
                      <span className="truncate mr-1">{cat}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-accent-blue bg-accent-blue' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motionFramer.div>
          </motionFramer.div>
        )}
      </AnimatePresenceFramer>

      {/* Wallet Selection Bottom Sheet */}
      <AnimatePresenceFramer>
        {isWalletSheetOpen && (
          <motionFramer.div 
            className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.4)', 
              backdropFilter: 'blur(8px)', 
              WebkitBackdropFilter: 'blur(8px)' 
            }}
            onClick={() => setIsWalletSheetOpen(false)}
          >
            <motionFramer.div 
              className="w-full max-w-[480px] rounded-t-[24px] border-t px-6 pt-3 pb-8 flex flex-col bg-white border-hairline max-h-[70vh]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />
              
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-lg font-heading font-bold text-ink">Pilih Dompet</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedWallets([])} 
                    className="text-xs font-semibold text-accent-blue"
                  >
                    Semua
                  </button>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto pr-1 pb-4">
                {wallets.map(w => {
                  const isChecked = selectedWallets.includes(w._id);
                  return (
                    <button
                      key={w._id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedWallets(prev => prev.filter(id => id !== w._id));
                        } else {
                          setSelectedWallets(prev => [...prev, w._id]);
                        }
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border text-xs w-full transition-colors text-left ${
                        isChecked 
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold' 
                          : 'border-hairline bg-slate-50 text-ink-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: w.color + '15', color: w.color }}
                        >
                          {w.icon || '💼'}
                        </div>
                        <span className="font-semibold">{w.name}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-accent-blue bg-accent-blue' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motionFramer.div>
          </motionFramer.div>
        )}
      </AnimatePresenceFramer>
    </div>
  );
}
