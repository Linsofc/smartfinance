import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart3, Wallet, Settings, Banknote } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Beranda' },
  { path: '/budget', icon: Banknote, label: 'Anggaran' },
  { path: '/analytics', icon: BarChart3, label: 'Analisis' },
  { path: '/wallet', icon: Wallet, label: 'Dompet' },
  { path: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-0.5 py-2 px-4 group no-underline"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-1/2 w-5 h-[2px] rounded-full bg-accent-blue -translate-x-1/2"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                className={`transition-colors duration-200 ${
                  isActive ? 'text-accent-blue' : 'text-ink-muted group-hover:text-ink'
                }`}
              />
              <span
                className={`text-[11px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-accent-blue' : 'text-ink-muted group-hover:text-ink'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
