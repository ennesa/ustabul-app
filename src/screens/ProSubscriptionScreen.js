import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Purchases from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ DÜZELTME: ESLint'in @env hatasını görmezden gelmesi için şu satırı ekledik:
// eslint-disable-next-line import/no-unresolved
import { REVENUECAT_APPLE_KEY, REVENUECAT_GOOGLE_KEY } from '@env';

import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

// API ANAHTARLARI (.env dosyasından gelir)
const APIKeys = {
  apple: REVENUECAT_APPLE_KEY, 
  google: REVENUECAT_GOOGLE_KEY 
};

export default function ProSubscriptionScreen({ navigation }) {
  const { user, userProfile, updateProfile } = useAuth();
  const { alertSuccess, alertError, alertInfo } = useUI();
  
  const [packages, setPackages] = useState([]); // RevenueCat Paketleri
  const [isPurchasing, setIsPurchasing] = useState(false);

  // --- 1. REVENUECAT KURULUMU ---
  useEffect(() => {
    const setupRevenueCat = async () => {
      try {
        // API anahtarları kontrol et
        const apiKey = Platform.OS === 'android' ? APIKeys.google : APIKeys.apple;
        
        if (!apiKey) {
            console.log("ℹ️ RevenueCat API anahtarı bulunamadı - Abonelik sistemi devre dışı");
            return;
        }

        await Purchases.configure({ apiKey: apiKey, appUserID: user?.uid });

        // Mevcut Paketleri Çek
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length !== 0) {
            setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        // RevenueCat hatası - sessizce geç
        if (e.message?.includes('singleton') || e.message?.includes('configure')) {
            console.log("ℹ️ RevenueCat yapılandırması atlandı");
        } else {
            console.log("Abonelik sistemi yüklenemedi:", e.message);
        }
      }
    };

    if(user) setupRevenueCat();
  }, [user]);

  // --- 2. ABONELİĞİ AKTİF ET (FIREBASE) ---
  const activateProFeatures = async () => {
      try {
          await firestore().collection('users').doc(user.uid).update({
              isSubscriptionActive: true,
              subscriptionDate: new Date().toISOString()
          });
          updateProfile({ isSubscriptionActive: true });

          alertSuccess("Tebrikler! 🎉", "Aboneliğiniz aktif edildi.");
          navigation.goBack();
      } catch (error) {
          alertError("Hata", "Profil güncellenemedi.");
      }
  };

  // --- 3. SATIN ALMA ---
  const handlePurchase = async (pkg) => {
      if (isPurchasing) return;
      setIsPurchasing(true);
      try {
          const { customerInfo } = await Purchases.purchasePackage(pkg);

          // Entitlement ID 'pro_access' (RevenueCat panelindeki isimle aynı olmalı)
          if (customerInfo.entitlements.active['pro_access']) {
              await activateProFeatures();
          }
      } catch (e) {
          if (!e.userCancelled) alertError("Hata", e.message);
      } finally {
          setIsPurchasing(false);
      }
  };

  // --- 4. GERİ YÜKLE (RESTORE) ---
  const restorePurchases = async () => {
      setIsPurchasing(true);
      try {
          const customerInfo = await Purchases.restorePurchases();
          if (customerInfo.entitlements.active['pro_access']) {
              await activateProFeatures();
          } else {
              alertInfo("Bilgi", "Aktif abonelik bulunamadı.");
          }
      } catch (e) {
          alertError("Hata", "Geri yükleme başarısız.");
      } finally {
          setIsPurchasing(false);
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Premium Üyelik 💎</Text>
            <TouchableOpacity onPress={restorePurchases}>
                <Text style={{color:'white', fontSize:12, textDecorationLine:'underline', fontWeight:'bold'}}>Geri Yükle</Text>
            </TouchableOpacity>
        </View>

        {/* BİLGİ KARTI */}
        <View style={{padding: 20}}>
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name="infinite" size={32} color="white" />
                </View>
                <Text style={styles.planTitle}>Sınırsız İş Fırsatı</Text>
                <Text style={{textAlign:'center', color:'#6b7280', marginTop:10}}>
                    Aylık sabit ücret ödeyin, sınırsız sayıda teklif verin. Komisyon yok, kesinti yok!
                </Text>
            </View>

            {/* PAKET LİSTESİ */}
            {packages.length === 0 ? (
                <View style={{marginTop: 50}}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={{color:'white', textAlign:'center', marginTop:10}}>Paketler yükleniyor...</Text>
                </View>
            ) : (
                packages.map((item) => (
                    <View key={item.identifier} style={styles.planCard}>
                        <View>
                            <Text style={styles.packageName}>{item.product.title}</Text>
                            <Text style={styles.packageDesc}>{item.product.description}</Text>
                        </View>
                        <View style={{alignItems:'flex-end'}}>
                            <Text style={styles.packagePrice}>{item.product.priceString}</Text>
                            <TouchableOpacity 
                                style={styles.buyBtn} 
                                onPress={() => handlePurchase(item)}
                                disabled={isPurchasing}
                            >
                                {isPurchasing ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.buyText}>Satın Al</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
        </View>

        <Text style={styles.footerNote}>
            Ödemeler Google Play / App Store hesabınız üzerinden tahsil edilir. İptal işlemlerini mağaza ayarlarından yapabilirsiniz.
        </Text>

      </ScrollView>
      
      {isPurchasing && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 25, marginBottom: 30, alignItems: 'center', elevation: 5 },
  iconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  planTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  
  // PAKET KARTLARI
  planCard: { 
      backgroundColor: 'rgba(255,255,255,0.1)', 
      borderRadius: 16, 
      padding: 20, 
      marginBottom: 15, 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)'
  },
  packageName: { color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 5, maxWidth: 150 },
  packageDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12, maxWidth: 150 },
  packagePrice: { color: '#fbbf24', fontWeight: 'bold', fontSize: 20, marginBottom: 10 },
  buyBtn: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  buyText: { color: COLORS.primary, fontWeight: 'bold' },

  footerNote: { textAlign:'center', color:'rgba(255,255,255,0.5)', marginTop: 20, fontSize: 11, paddingHorizontal: 40 },
  loadingOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});