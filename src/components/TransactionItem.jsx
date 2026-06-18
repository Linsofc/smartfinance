import { motion } from 'framer-motion';

// Category icon mapping
const CATEGORY_ICONS = {
  'Makanan': '🍲',
  'Jajanan': '🍿',
  'Belanja': '🛒',
  'Transportasi': '🚗',
  'Pendidikan': '📚',
  'Hiburan': '🎮',
  'Pajak': '📋',
  'Lainnya': '🛍️',
  'Hadiah': '🎁',
  'Tarik Uang': '💳',
  'Gaji': '💼',
  'Pekerja Lepas': '💻',
  'Investasi': '📈',
  'Hadiah Diterima': '🎁',
  'Bisnis': '🏪',
  'Bonus': '💵',
  'UANG BULANAN': '💰',
  'terima': '💳',
};

// Category color mapping
const CATEGORY_COLORS = {
  'Makanan': '#ff7a3d',
  'Jajanan': '#d44df0',
  'Belanja': '#6a4cf5',
  'Transportasi': '#1890ff',
  'Pendidikan': '#1e9045',
  'Hiburan': '#ff5577',
  'Pajak': '#64748b',
  'Lainnya': '#64748b',
  'Hadiah': '#d44df0',
  'Tarik Uang': '#ff5577',
  'Gaji': '#ff7a3d',
  'Pekerja Lepas': '#1890ff',
  'Investasi': '#1e9045',
  'Hadiah Diterima': '#d44df0',
  'Bisnis': '#6a4cf5',
  'Bonus': '#ff5577',
  'UANG BULANAN': '#1e9045',
  'terima': '#f59e0b',
};

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TransactionItem({ transaction, index = 0, onClick }) {
  const { type, category, amount, note } = transaction;
  const icon = CATEGORY_ICONS[category] || (type === 'INCOME' ? '💰' : '📦');
  const color = CATEGORY_COLORS[category] || (type === 'INCOME' ? '#22c55e' : '#ff5577');
  const isExpense = type === 'EXPENSE';

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 py-3.5 px-4 hover:bg-surface-2/60 transition-colors cursor-pointer group"
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink truncate">{category}</p>
          {transaction.walletId && typeof transaction.walletId === 'object' && transaction.walletId.name && (
            <span 
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border"
              style={{ 
                color: transaction.walletId.color || '#999999',
                backgroundColor: `${transaction.walletId.color || '#999999'}15`,
                borderColor: `${transaction.walletId.color || '#999999'}30`
              }}
            >
              {transaction.walletId.name}
            </span>
          )}
        </div>
        {note && (
          <p className="text-xs text-ink-muted truncate mt-0.5">{note}</p>
        )}
      </div>

      {/* Amount */}
      <span
        className={`text-sm font-semibold tabular-nums tracking-tight whitespace-nowrap ${
          isExpense ? 'text-danger' : 'text-success'
        }`}
      >
        {isExpense ? '-' : ''}{formatRupiah(amount)}
      </span>
    </div>
  );
}

export { CATEGORY_ICONS, CATEGORY_COLORS };
