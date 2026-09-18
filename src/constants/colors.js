// src/constants/colors.js

export const COLORS = {
  primary: '#2563EB',    // Ana Mavi
  secondary: '#1E40AF',  // Koyu Mavi
  accent: '#F59E0B',     // Turuncu (Vurgu)
  success: '#10B981',    // Yeşil
  danger: '#EF4444',     // Kırmızı
  text: '#1F2937',       // Koyu Gri Metin
  subText: '#6B7280',    // Açık Gri Metin
  input: '#F3F4F6',      // Input Arkaplanı
  border: '#E5E7EB',     // Çerçeve Rengi
  bg: '#FFFFFF',         // Arkaplan
  green: '#16a34a',      // Özel yeşil
  gray: '#64748b'
};

// TEMA AYARLARI (Hatayı çözen kısım burası)
export const THEME = {
  light: {
    dark: false,
    background: '#FFFFFF',
    text: '#1F2937',
    subText: '#6B7280',
    card: '#FFFFFF',
    border: '#E5E7EB',
    input: '#F3F4F6',
    primary: '#2563EB',
    statusBar: 'dark-content'
  },
  dark: {
    dark: true,
    background: '#111827',
    text: '#F9FAFB',
    subText: '#9CA3AF',
    card: '#1F2937',
    border: '#374151',
    input: '#374151',
    primary: '#3B82F6',
    statusBar: 'light-content'
  }
};