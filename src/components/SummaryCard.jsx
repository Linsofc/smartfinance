import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SummaryCard({ income, expense }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-4 p-5 rounded-[20px] bg-surface-1 border border-hairline-soft"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Income */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-ink-muted">
            <TrendingUp size={14} className="text-success" />
            <span className="text-xs font-medium">Pemasukan</span>
          </div>
          <motion.span
            key={income}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-success font-bold text-base tabular-nums tracking-tight"
          >
            {formatRupiah(income)}
          </motion.span>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-hairline" />

        {/* Expense */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-ink-muted">
            <TrendingDown size={14} className="text-danger" />
            <span className="text-xs font-medium">Pengeluaran</span>
          </div>
          <motion.span
            key={expense}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-danger font-bold text-base tabular-nums tracking-tight"
          >
            -{formatRupiah(expense)}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
