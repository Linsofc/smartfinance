import { motion } from 'framer-motion';

function SkeletonRect({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-surface-2 rounded-xl ${className}`}
    />
  );
}

function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <div
      className={`animate-pulse bg-surface-2 rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

function SkeletonText({ lines = 2, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 flex-1 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonRect
          key={i}
          className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse bg-surface-1 rounded-[20px] border border-hairline-soft p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle size={44} />
        <div className="flex-1 space-y-2">
          <SkeletonRect className="h-3.5 w-2/3" />
          <SkeletonRect className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonRect className="h-2 w-full mb-3" />
      <div className="flex justify-between">
        <SkeletonRect className="h-3 w-16" />
        <SkeletonRect className="h-3 w-20" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-surface-1 rounded-[20px] border border-hairline-soft p-4 flex items-center gap-3"
        >
          <SkeletonCircle size={40} />
          <SkeletonText lines={2} />
          <div className="flex flex-col items-end gap-2 shrink-0">
            <SkeletonRect className="h-4 w-20" />
            <SkeletonRect className="h-3 w-14" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function WalletSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-brand-blue-dark to-brand-blue-light rounded-[24px] p-6"
      >
        <SkeletonRect className="h-3 w-20 bg-white/20 mb-3" />
        <SkeletonRect className="h-8 w-44 bg-white/20 mb-2" />
        <SkeletonRect className="h-3 w-24 bg-white/20" />
      </motion.div>

      {['Tunai', 'E-Wallet'].map((cat, ci) => (
        <div key={cat} className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <SkeletonRect className="h-3 w-16" />
            <SkeletonRect className="h-3 w-20" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (ci * 2 + i) * 0.06 }}
                className="bg-surface-1 rounded-[20px] p-4 border border-hairline-soft flex items-center gap-4"
              >
                <SkeletonCircle size={44} />
                <div className="flex-1 min-w-0 space-y-2">
                  <SkeletonRect className="h-4 w-28" />
                  <SkeletonRect className="h-3 w-16" />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <SkeletonRect className="h-4 w-20" />
                  <div className="flex gap-1.5">
                    <SkeletonRect className="h-7 w-7 rounded-lg" />
                    <SkeletonRect className="h-7 w-7 rounded-lg" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-surface-1 rounded-3xl p-5 border border-hairline-soft"
      >
        <div className="flex justify-between mb-5">
          <div className="space-y-2">
            <SkeletonRect className="h-3 w-24" />
            <SkeletonRect className="h-8 w-36" />
          </div>
          <div className="space-y-2 text-right">
            <SkeletonRect className="h-3 w-20 ml-auto" />
            <SkeletonRect className="h-6 w-28 ml-auto" />
          </div>
        </div>
        <SkeletonRect className="h-2.5 w-full rounded-full" />
      </motion.div>

      {Array.from({ length: 2 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08 }}
          className="bg-surface-1 rounded-3xl p-4 border border-hairline-soft"
        >
          <div className="flex gap-4">
            <SkeletonCircle size={48} />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <SkeletonRect className="h-4 w-28" />
                  <SkeletonRect className="h-3 w-20" />
                </div>
                <div className="space-y-2 text-right">
                  <SkeletonRect className="h-3.5 w-16 ml-auto" />
                  <SkeletonRect className="h-3 w-20 ml-auto" />
                </div>
              </div>
              <SkeletonRect className="h-2 w-full rounded-full" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-surface-2 min-h-screen px-4 py-6 space-y-5">
      <div className="space-y-1">
        <SkeletonRect className="h-7 w-48" />
        <SkeletonRect className="h-3 w-64 mt-2" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRect key={i} className="h-8 flex-1 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-surface-1 rounded-[20px] border border-hairline-soft p-4"
          >
            <SkeletonCircle size={36} />
            <SkeletonRect className="h-3 w-16 mt-3" />
            <SkeletonRect className="h-6 w-28 mt-2" />
            <SkeletonRect className="h-3 w-20 mt-1" />
          </motion.div>
        ))}
      </div>

      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export {
  SkeletonRect,
  SkeletonCircle,
  SkeletonText,
  SkeletonCard,
  DashboardSkeleton,
  WalletSkeleton,
  BudgetSkeleton,
  AnalyticsSkeleton,
};
