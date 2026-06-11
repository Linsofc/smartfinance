import { motion } from 'framer-motion';
import TransactionItem from './TransactionItem';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  
  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName}, ${day} ${month} ${year}`;
}

export default function TransactionGroup({ date, transactions, index = 0 }) {
  const income = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="mx-4 mb-3 rounded-[20px] bg-surface-1 border border-hairline-soft overflow-hidden"
    >
      {/* Date Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-soft">
        <span className="text-xs font-semibold text-ink-muted tracking-wide">
          {formatDate(date)}
        </span>
        <div className="flex items-center gap-3">
          {income > 0 && (
            <span className="text-xs font-semibold text-success tabular-nums">
              {formatRupiah(income)}
            </span>
          )}
          {expense > 0 && (
            <span className="text-xs font-semibold text-danger tabular-nums">
              -{formatRupiah(expense)}
            </span>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-hairline-soft">
        {transactions.map((transaction, i) => (
          <TransactionItem
            key={transaction._id || i}
            transaction={transaction}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
}
