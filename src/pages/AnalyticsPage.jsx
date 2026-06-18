import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, TrendingDown, Hash } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useTransactions } from '../context/TransactionContext';

const CHART_COLORS = [
  '#ff7a3d', '#6a4cf5', '#d44df0', '#1890ff', '#1e9045',
  '#ff5577', '#64748b', '#f59e0b', '#10b981', '#8b5cf6',
];

function formatRupiah(amount) {
  if (amount >= 1000000) return `Rp${(amount / 1000000).toFixed(1)}jt`;
  if (amount >= 1000) return `Rp${(amount / 1000).toFixed(0)}rb`;
  return `Rp${amount}`;
}

function formatRupiahFull(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-hairline rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs font-semibold text-ink mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs tabular-nums" style={{ color: entry.color }}>
            {entry.name}: {formatRupiahFull(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { analytics, loading, fetchAnalytics } = useTransactions();

  useEffect(() => {
    fetchAnalytics(year);
  }, [year, fetchAnalytics]);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ink-muted border-t-accent-blue rounded-full animate-spin" />
          <p className="text-ink-muted text-xs">Memuat analisis...</p>
        </div>
      </div>
    );
  }

  const { categories, monthly, summary } = analytics;
  const totalExpenseForPie = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight" style={{ letterSpacing: '-1px' }}>
            Analisis
          </h1>
          <p className="text-ink-muted text-xs mt-1">Ringkasan keuangan Anda</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setYear(year - 1)}
            className="w-8 h-8 rounded-full bg-surface-1 flex items-center justify-center text-ink-muted hover:text-ink text-sm font-bold"
          >
            ←
          </motion.button>
          <span className="text-sm font-semibold text-ink tabular-nums min-w-[3rem] text-center">{year}</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setYear(year + 1)}
            className="w-8 h-8 rounded-full bg-surface-1 flex items-center justify-center text-ink-muted hover:text-ink text-sm font-bold"
          >
            →
          </motion.button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-1 rounded-[20px] p-4 border border-hairline-soft"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
              <TrendingUp size={16} className="text-success" />
            </div>
          </div>
          <p className="text-xs text-ink-muted mb-1">Total Pemasukan</p>
          <p className="text-lg font-bold text-success tabular-nums tracking-tight">
            {formatRupiahFull(summary.totalIncome)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface-1 rounded-[20px] p-4 border border-hairline-soft"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger/15 flex items-center justify-center">
              <TrendingDown size={16} className="text-danger" />
            </div>
          </div>
          <p className="text-xs text-ink-muted mb-1">Total Pengeluaran</p>
          <p className="text-lg font-bold text-danger tabular-nums tracking-tight">
            {formatRupiahFull(summary.totalExpense)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-1 rounded-[20px] p-4 border border-hairline-soft"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/15 flex items-center justify-center">
              <BarChart3 size={16} className="text-accent-blue" />
            </div>
          </div>
          <p className="text-xs text-ink-muted mb-1">Saldo</p>
          <p className={`text-lg font-bold tabular-nums tracking-tight ${summary.balance >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatRupiahFull(summary.balance)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface-1 rounded-[20px] p-4 border border-hairline-soft"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/15 flex items-center justify-center">
              <Hash size={16} className="text-accent-blue" />
            </div>
          </div>
          <p className="text-xs text-ink-muted mb-1">Transaksi</p>
          <p className="text-lg font-bold text-ink tabular-nums tracking-tight">
            {summary.transactionCount}
          </p>
        </motion.div>
      </div>

      {/* Monthly Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface-1 rounded-[20px] p-5 border border-hairline-soft"
      >
        <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-accent-blue" />
          Pemasukan vs Pengeluaran
        </h3>
        <div className="h-52 w-full relative min-h-[208px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} barGap={2} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatRupiah}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Pemasukan" fill="#1e9045" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#ea3a3a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface-1 rounded-[20px] p-5 border border-hairline-soft"
      >
        <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
          <PieChartIcon size={16} className="text-accent-blue" />
          Pengeluaran per Kategori
        </h3>
        {categories.length === 0 ? (
          <p className="text-ink-muted text-xs text-center py-8">Belum ada data pengeluaran</p>
        ) : (
          <>
            <div className="h-52 w-full relative min-h-[208px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {categories.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatRupiahFull(value)}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#1e293b',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-2 mt-4">
              {categories.slice(0, 8).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-ink flex-1 truncate">{cat.name}</span>
                  <span className="text-xs text-ink-muted tabular-nums">
                    {formatRupiahFull(cat.amount)}
                  </span>
                  <span className="text-[10px] text-ink-muted tabular-nums w-10 text-right">
                    {totalExpenseForPie > 0 ? `${((cat.amount / totalExpenseForPie) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
