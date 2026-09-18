// =====================================================
// 📝 ENV TYPE DECLARATIONS
// =====================================================
// Bu dosya @env importlarında TypeScript hata vermemesi için
// =====================================================

declare module '@env' {
  // Firebase
  export const EXPO_PUBLIC_FIREBASE_API_KEY: string;
  export const EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  export const EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
  export const EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  export const EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  export const EXPO_PUBLIC_FIREBASE_APP_ID: string;
  
  // Google Maps
  export const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
  
  // RevenueCat
  export const EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: string;
  export const EXPO_PUBLIC_REVENUECAT_APPLE_KEY: string;
  
  // Iyzico (İleride)
  export const EXPO_PUBLIC_IYZICO_API_KEY: string;
  export const EXPO_PUBLIC_IYZICO_SECRET_KEY: string;
  export const EXPO_PUBLIC_IYZICO_BASE_URL: string;
}
