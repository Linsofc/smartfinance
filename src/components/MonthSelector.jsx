import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function MonthSelector({ month, year, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onPrev}
        className="w-10 h-10 rounded-full bg-surface-1 flex items-center justify-center text-ink border border-hairline hover:bg-surface-2 transition-colors"
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft size={20} />
      </motion.button>

      <motion.h2
        key={`${month}-${year}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-heading font-semibold tracking-tight text-ink"
      >
        {MONTH_NAMES[month - 1]} {year}
      </motion.h2>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onNext}
        className="w-10 h-10 rounded-full bg-surface-1 flex items-center justify-center text-ink border border-hairline hover:bg-surface-2 transition-colors"
        aria-label="Bulan berikutnya"
      >
        <ChevronRight size={20} />
      </motion.button>
    </div>
  );
}
