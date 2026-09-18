// src/config/pricing.js
// =====================================================
// 💰 PROUSTA FİYATLANDIRMA MERKEZİ
// =====================================================
// Bu dosyadan tüm fiyatları yönetebilirsin.
// Değişiklik yapmak için sadece buradaki değerleri güncelle.
// =====================================================

export const PRICING = {
  // ─────────────────────────────────────────────────
  // 📋 İLAN ÜCRETLERİ
  // ─────────────────────────────────────────────────
  POSTING_FEE: 20,              // Normal ilan ücreti (TL)
  LUXURY_POSTING_FEE: 50,       // Lüks ilan ücreti (TL) - İleride kullanılacak
  URGENT_POSTING_FEE: 35,       // Acil ilan ücreti (TL) - İleride kullanılacak

  // ─────────────────────────────────────────────────
  // 👑 MÜŞTERİ VIP PAKETLERİ (İleride kullanılacak)
  // ─────────────────────────────────────────────────
  CUSTOMER_VIP_MONTHLY: 99,     // Aylık VIP üyelik
  CUSTOMER_VIP_YEARLY: 500,     // Yıllık VIP üyelik (indirimli)
  
  // ─────────────────────────────────────────────────
  // 🔨 USTA ABONELİK PAKETLERİ
  // ─────────────────────────────────────────────────
  PRO_MONTHLY: 149,             // Usta aylık abonelik
  PRO_YEARLY: 999,              // Usta yıllık abonelik
  PRO_VERIFIED_MONTHLY: 299,    // Onaylı usta aylık
  PRO_VERIFIED_YEARLY: 1999,    // Onaylı usta yıllık

  // ─────────────────────────────────────────────────
  // 💳 BAKİYE YÜKLEme PAKETLERİ
  // ─────────────────────────────────────────────────
  BALANCE_PACKAGES: [
    { id: 'pack_20', amount: 20, bonus: 0, label: '20 ₺' },
    { id: 'pack_50', amount: 50, bonus: 5, label: '50 ₺ + 5 ₺ Bonus' },
    { id: 'pack_100', amount: 100, bonus: 15, label: '100 ₺ + 15 ₺ Bonus' },
    { id: 'pack_200', amount: 200, bonus: 40, label: '200 ₺ + 40 ₺ Bonus' },
  ],

  // ─────────────────────────────────────────────────
  // 🎁 PROMOSYONLAR (İleride kullanılacak)
  // ─────────────────────────────────────────────────
  FIRST_POST_FREE: false,       // İlk ilan ücretsiz mi?
  REFERRAL_BONUS: 10,           // Referans bonusu (TL)

  // ─────────────────────────────────────────────────
  // ⚙️ SİSTEM AYARLARI
  // ─────────────────────────────────────────────────
  MIN_BALANCE_WARNING: 20,      // Bu bakiyenin altında uyarı göster
  CURRENCY: '₺',
  CURRENCY_CODE: 'TRY',
};

// ─────────────────────────────────────────────────
// 🛠️ YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────────

// Fiyatı formatlı göster
export const formatPrice = (amount) => {
  return `${amount} ${PRICING.CURRENCY}`;
};

// Bakiye yeterli mi kontrol et
export const hasEnoughBalance = (userBalance, requiredAmount) => {
  return (userBalance || 0) >= requiredAmount;
};

// İlan tipine göre ücret getir
export const getPostingFee = (postType = 'normal') => {
  switch (postType) {
    case 'luxury':
      return PRICING.LUXURY_POSTING_FEE;
    case 'urgent':
      return PRICING.URGENT_POSTING_FEE;
    default:
      return PRICING.POSTING_FEE;
  }
};