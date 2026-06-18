/**
 * Preset wallet logos for Indonesian banks & e-wallets.
 * Each entry has: id, label, bgColor, textColor, and a render function.
 * Logos are styled text-based representations for consistency and zero external dependencies.
 */

const WALLET_LOGOS = [
  {
    id: 'dana',
    label: 'DANA',
    bgColor: '#108ee9',
    textColor: '#fff',
    text: 'DANA',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  {
    id: 'gopay',
    label: 'GoPay',
    bgColor: '#00AED6',
    textColor: '#fff',
    text: 'GoPay',
    fontSize: '10px',
    fontWeight: 700,
  },
  {
    id: 'ovo',
    label: 'OVO',
    bgColor: '#4C3494',
    textColor: '#fff',
    text: 'OVO',
    fontSize: '12px',
    fontWeight: 900,
    letterSpacing: '1px',
  },
  {
    id: 'shopeepay',
    label: 'ShopeePay',
    bgColor: '#EE4D2D',
    textColor: '#fff',
    text: 'SPay',
    fontSize: '10px',
    fontWeight: 800,
  },
  {
    id: 'linkaja',
    label: 'LinkAja',
    bgColor: '#E31E25',
    textColor: '#fff',
    text: 'Link',
    fontSize: '10px',
    fontWeight: 800,
  },
  {
    id: 'bca',
    label: 'BCA',
    bgColor: '#003D79',
    textColor: '#fff',
    text: 'BCA',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '1px',
  },
  {
    id: 'bni',
    label: 'BNI',
    bgColor: '#F15A22',
    textColor: '#fff',
    text: 'BNI',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.5px',
  },
  {
    id: 'bri',
    label: 'BRI',
    bgColor: '#00529C',
    textColor: '#fff',
    text: 'BRI',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.5px',
  },
  {
    id: 'mandiri',
    label: 'Mandiri',
    bgColor: '#003876',
    textColor: '#FFD500',
    text: 'MDR',
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '1px',
  },
  {
    id: 'btn',
    label: 'BTN',
    bgColor: '#1A3668',
    textColor: '#fff',
    text: 'BTN',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.5px',
  },
  {
    id: 'bsi',
    label: 'BSI',
    bgColor: '#00A450',
    textColor: '#fff',
    text: 'BSI',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.5px',
  },
  {
    id: 'cimb',
    label: 'CIMB Niaga',
    bgColor: '#EC1C24',
    textColor: '#fff',
    text: 'CIMB',
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  {
    id: 'permata',
    label: 'Permata',
    bgColor: '#006B3F',
    textColor: '#fff',
    text: 'PMT',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  {
    id: 'jago',
    label: 'Bank Jago',
    bgColor: '#FFD100',
    textColor: '#1A1A1A',
    text: 'JAGO',
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '0.5px',
  },
  {
    id: 'jenius',
    label: 'Jenius',
    bgColor: '#00B2FF',
    textColor: '#fff',
    text: 'JNS',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  {
    id: 'blu',
    label: 'blu by BCA',
    bgColor: '#0066FF',
    textColor: '#fff',
    text: 'blu',
    fontSize: '12px',
    fontWeight: 800,
  },
  {
    id: 'flip',
    label: 'Flip',
    bgColor: '#FF6B2C',
    textColor: '#fff',
    text: 'FLIP',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  {
    id: 'sakuku',
    label: 'Sakuku',
    bgColor: '#005BAA',
    textColor: '#FFD500',
    text: 'SKK',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  {
    id: 'isaku',
    label: 'iSaku',
    bgColor: '#E31937',
    textColor: '#fff',
    text: 'iSaku',
    fontSize: '10px',
    fontWeight: 700,
  },
  {
    id: 'cash',
    label: 'Kas / Cash',
    bgColor: '#22c55e',
    textColor: '#fff',
    text: '💵',
    fontSize: '18px',
    fontWeight: 400,
    isEmoji: true,
  },
  {
    id: 'invest',
    label: 'Investasi',
    bgColor: '#8b5cf6',
    textColor: '#fff',
    text: '📈',
    fontSize: '18px',
    fontWeight: 400,
    isEmoji: true,
  },
  {
    id: 'savings',
    label: 'Tabungan',
    bgColor: '#f59e0b',
    textColor: '#fff',
    text: '🏦',
    fontSize: '18px',
    fontWeight: 400,
    isEmoji: true,
  },
  {
    id: 'credit',
    label: 'Kartu Kredit',
    bgColor: '#ef4444',
    textColor: '#fff',
    text: '💳',
    fontSize: '18px',
    fontWeight: 400,
    isEmoji: true,
  },
];

/**
 * Renders a preset logo badge
 */
export function LogoBadge({ logoId, size = 40, className = '' }) {
  const preset = WALLET_LOGOS.find(l => l.id === logoId);
  if (!preset) return null;

  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: preset.bgColor,
      }}
    >
      <span
        style={{
          color: preset.textColor,
          fontSize: preset.fontSize,
          fontWeight: preset.fontWeight || 700,
          letterSpacing: preset.letterSpacing || '0px',
          lineHeight: 1,
          fontFamily: preset.isEmoji ? 'inherit' : "'Inter', 'SF Pro Display', system-ui, sans-serif",
        }}
      >
        {preset.text}
      </span>
    </div>
  );
}

/**
 * Renders a wallet logo — handles preset IDs, data URIs, and fallback to Lucide icon
 */
export function WalletLogo({ logo, icon, color, size = 44, IconComp, className = '' }) {
  // 1. If logo is a preset ID
  const preset = logo ? WALLET_LOGOS.find(l => l.id === logo) : null;
  if (preset) {
    return <LogoBadge logoId={logo} size={size} className={className} />;
  }

  // 2. If logo is a data URI (custom upload)
  if (logo && logo.startsWith('data:image')) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 overflow-hidden ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: `${color || '#6a4cf5'}18`,
        }}
      >
        <img
          src={logo}
          alt="Wallet logo"
          style={{
            width: size * 0.75,
            height: size * 0.75,
            objectFit: 'contain',
          }}
        />
      </div>
    );
  }

  // 3. Fallback: Lucide icon
  if (IconComp) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: `${color || '#6a4cf5'}18`,
        }}
      >
        <IconComp size={size * 0.45} style={{ color: color || '#6a4cf5' }} />
      </div>
    );
  }

  return null;
}

export default WALLET_LOGOS;
