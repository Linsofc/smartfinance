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
      <div className="bottom-nav-inner">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="nav-item"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="nav-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                style={{ color: isActive ? '#0099ff' : '#999999', transition: 'color 0.2s' }}
              />
              <span
                className="nav-label"
                style={{ color: isActive ? '#0099ff' : '#999999' }}
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
