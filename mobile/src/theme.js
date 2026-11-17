// CyberBoost Mobile - Cyberpunk Dark Theme Design System

export const colors = {
  bg: '#0a0b10',           // Deep dark space
  surface: '#121520',      // Card surface
  surfaceElevated: '#1a1f30', // Elevated modal / input surface
  border: 'rgba(0, 240, 255, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  
  // Neon Cyber Accents
  cyan: '#00f0ff',
  cyanGlow: 'rgba(0, 240, 255, 0.35)',
  gold: '#ffd700',
  goldGlow: 'rgba(255, 215, 0, 0.35)',
  purple: '#a855f7',
  green: '#10b981',
  danger: '#ef4444',
  orange: '#f97316',
  
  // Text Colors
  textMain: '#ffffff',
  textSecondary: '#94a3b8',
  textDim: '#64748b',
};

export const shadows = {
  cyanGlow: {
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  }
};
