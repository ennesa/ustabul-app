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

import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

// --- SABİT TASARIM VERİLERİ ---
const SUBSCRIPTION_METADATA = [
    { 
        id: '1_month', 
        title: 'Aylık Paket', 
        durationMonth: 1, 
        badge: null,
        fallbackPrice: '100 ₺' 
    },
    { 
        id: '6_month', 
        title: '6 Aylık Paket', 
        durationMonth: 6, 
        badge: '%17 İndirim', 
        oldPrice: '600 ₺' 
    },
    { 
        id: '12_month', 
        title: 'Yıllık Paket', 
        durationMonth: 12, 
        badge: 'En Popüler 🔥',
        oldPrice: '1200 ₺'
    }
];

// RevenueCat Ürün ID'si (Rozet)
const BADGE_PRODUCT_ID = 'verified_badge'; 

// ✅ RevenueCat Yetki Kimliği (Dashboard'daki 'Entitlements' kısmındaki ID ile AYNI OLMALI)
const ENTITLEMENT_ID = 'pro_access'; 

export default function StoreScreen({ navigation }) {
  const { theme, alertSuccess, alertError, alertInfo, alertWarning } = useUI();
  const { user, userProfile, updateProfile } = useAuth(); 
  
  const [loading, setLoading] = useState(false);
  const [availablePackages, setAvailablePackages] = useState([]); 
  const [badgePackage, setBadgePackage] = useState(null); 

  // --- 1. ABONELİK DURUMU HESAPLAMA ---
  const getRemainingDays = () => {
      if (!userProfile?.subscriptionEndDate) return 0;
      
      const endDate = userProfile.subscriptionEndDate.seconds 
          ? new Date(userProfile.subscriptionEndDate.seconds * 1000) 
          : new Date(userProfile.subscriptionEndDate);

      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : 0;
  };

  const remainingDays = getRemainingDays();
  const isActive = remainingDays > 0;

  // --- 2. REVENUECAT VERİLERİNİ ÇEK ---
  useEffect(() => {
      const fetchOfferings = async () => {
          try {
              const offerings = await Purchases.getOfferings();
              
              if (offerings.current && offerings.current.availablePackages.length > 0) {
                  setAvailablePackages(offerings.current.availablePackages);
              }

              if (offerings.current) {
                  const badgePkg = offerings.current.availablePackages.find(
                      p => p.product.identifier === BADGE_PRODUCT_ID
                  );
                  if (badgePkg) setBadgePackage(badgePkg);
              }

          } catch (e) {
              // RevenueCat hatası - sessizce geç (henüz yapılandırılmamış olabilir)
              if (e.message?.includes('singleton') || e.message?.includes('configure')) {
                  console.log("ℹ️ RevenueCat henüz yapılandırılmamış - Abonelik sistemi ayarlanmadı");
              } else {
                  console.log("Market bağlantısı kurulamadı");
              }
          }
      };
      fetchOfferings();
  }, []);

  // --- 3. GÜVENLİ ABONELİK SATIN ALMA ---
  const handleSubscription = async (metaItem) => {
    const rcPackage = availablePackages.find(p => p.product.identifier === metaItem.id);

    if (!rcPackage) {
        alertError("Hata", "Bu paket şu an market bağlantısı kurulamadığı için alınamıyor.");
        return;
    }

    alertInfo(
        metaItem.title,
        `${rcPackage.product.priceString} ödeyerek aboneliği başlatmak istiyor musunuz?`,
        [
            { text: "Vazgeç", style: "cancel" },
            {
                text: "Öde ve Başlat",
                onPress: async () => {
                    setLoading(true);
                    try {
                        // A) Ödeme Penceresi
                        const { customerInfo } = await Purchases.purchasePackage(rcPackage);

                        // ✅ DÜZELTME: Güvenli Yetki Kontrolü
                        const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";

                        if (isPro) {

                            // C) Firebase Güncelleme
                            const userRef = firestore().collection('users').doc(user.uid);

                            // Tarih Uzatma Mantığı
                            let newEndDate = new Date();
                            if (isActive && userProfile.subscriptionEndDate) {
                                const currentEnd = userProfile.subscriptionEndDate.seconds
                                    ? new Date(userProfile.subscriptionEndDate.seconds * 1000)
                                    : new Date(userProfile.subscriptionEndDate);
                                newEndDate = new Date(currentEnd);
                            }

                            newEndDate.setMonth(newEndDate.getMonth() + metaItem.durationMonth);

                            await userRef.update({
                                isSubscriptionActive: true,
                                subscriptionEndDate: newEndDate
                            });

                            updateProfile({ isSubscriptionActive: true });

                            alertSuccess("Başarılı", "Aboneliğiniz başarıyla aktif edildi! 🎉");
                        } else {
                            // Ödeme başarılı ama yetki dönmediyse (Nadir durum)
                            alertWarning(
                                "İşlem Beklemede",
                                "Ödemeniz alındı ancak yetki henüz yansımadı. Lütfen 'Satın Almaları Geri Yükle' yapın veya sayfayı yenileyin."
                            );
                        }
                    } catch (error) {
                        if (!error.userCancelled) {
                            alertError("Hata", "Satın alma işlemi başarısız: " + error.message);
                        }
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]
    );
  };

  // --- 4. GÜVENLİ ROZET SATIN ALMA ---
  const handleBadgePurchase = async () => {
      if (userProfile?.isVerifiedBadge) {
          alertInfo("Bilgi", "Zaten onaylı rozetiniz var. 😎");
          return;
      }

      if (!isActive) {
          alertWarning("Abonelik Gerekli", "Güven rozeti almak için önce abonelik satın almalısınız.");
          return;
      }

      alertInfo(
          "Güven Rozeti",
          "Profilinizde 'Onaylı Hesap' rozeti görünecek. Müşteriler size daha çok güvenecek.",
          [
              { text: "Vazgeç", style: "cancel" },
              {
                  text: "Satın Al",
                  onPress: async () => {
                      setLoading(true);
                      try {
                          if (badgePackage) {
                              await Purchases.purchasePackage(badgePackage);
                          }

                          await firestore().collection('users').doc(user.uid).update({
                              isVerifiedBadge: true
                          });
                          updateProfile({ isVerifiedBadge: true });

                          alertSuccess("Harika!", "Rozetiniz profilinize eklendi.");

                      } catch (e) {
                          if (!e.userCancelled) {
                              alertError("Hata", e.message);
                          }
                      } finally {
                          setLoading(false);
                      }
                  }
              }
          ]
      );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar barStyle={theme.statusBar} />

      {/* HEADER */}
      <View style={[styles.header, {borderBottomColor: theme.border}]}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 10, padding: 5}}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
         </TouchableOpacity>
         <Text style={[styles.headerTitle, {color: theme.text}]}>Mağaza & Üyelik</Text>
      </View>

      <ScrollView contentContainerStyle={{padding: 20}}>
        
        {/* 1. DURUM KARTI */}
        <View style={styles.statusCard}>
            <View>
                <Text style={styles.statusLabel}>Abonelik Durumu</Text>
                <Text style={styles.statusValue}>
                    {isActive ? `Aktif (${remainingDays} Gün)` : 'Pasif - Süre Dolmuş'}
                </Text>
            </View>
            <View style={{backgroundColor:'rgba(255,255,255,0.2)', padding:10, borderRadius:15}}>
                <Ionicons name={isActive ? "shield-checkmark" : "lock-closed"} size={32} color="white" />
            </View>
        </View>

        {/* 2. GÜVEN ROZETİ */}
        <Text style={[styles.sectionTitle, {color: theme.text}]}>Ekstralar</Text>
        <TouchableOpacity 
            style={[styles.badgeCard, {backgroundColor: userProfile?.isVerifiedBadge ? '#dcfce7' : theme.card, borderColor: theme.border}]}
            onPress={handleBadgePurchase}
            disabled={userProfile?.isVerifiedBadge || loading}
        >
            <View style={{flexDirection:'row', alignItems:'center', flex: 1, marginRight: 10}}>
                <View style={[styles.iconBox, {backgroundColor: '#dbeafe'}]}>
                    <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
                </View>
                <View style={{marginLeft: 15, flex: 1}}>
                    <Text style={[styles.planTitle, {color: theme.text}]}>Güven Rozeti</Text>
                    <Text style={{color: theme.subText, fontSize: 12}}>
                        {userProfile?.isVerifiedBadge ? 'Profilinizde aktif.' : 'Müşterilere güven verin.'}
                    </Text>
                </View>
            </View>

            <View style={{flexShrink: 0}}>
                {userProfile?.isVerifiedBadge ? (
                    <Ionicons name="checkmark-circle" size={28} color="#16a34a" />
                ) : (
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>
                            {badgePackage ? badgePackage.product.priceString : '100 ₺'}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>

        {/* 3. ABONELİK PAKETLERİ */}
        <Text style={[styles.sectionTitle, {color: theme.text, marginTop: 20}]}>Abonelik Paketleri</Text>
        
        {SUBSCRIPTION_METADATA.map((meta) => {
            const rcPackage = availablePackages.find(p => p.product.identifier === meta.id);
            const displayPrice = rcPackage ? rcPackage.product.priceString : meta.fallbackPrice;

            return (
                <TouchableOpacity 
                    key={meta.id}
                    style={[styles.planCard, {backgroundColor: theme.card, borderColor: isActive ? COLORS.primary : theme.border}]}
                    onPress={() => handleSubscription(meta)}
                    disabled={loading}
                >
                    {meta.badge && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{meta.badge}</Text>
                        </View>
                    )}

                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                        <View style={{flex: 1, marginRight: 15}}>
                            <Text style={[styles.planTitle, {color: theme.text}]}>{meta.title}</Text>
                            <Text style={{color: theme.subText, fontSize:12}}>Sınırsız teklif verme hakkı</Text>
                        </View>
                        
                        <View style={{alignItems:'flex-end', minWidth: 80, flexShrink: 0}}>
                            {meta.oldPrice && (
                                <Text style={{textDecorationLine:'line-through', color: theme.subText, fontSize:12}}>
                                    {meta.oldPrice}
                                </Text>
                            )}
                            <Text style={{fontSize: 20, fontWeight:'bold', color: COLORS.primary}}>
                                {displayPrice}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        })}

        <Text style={{textAlign:'center', color:theme.subText, marginTop:20, fontSize:12, marginBottom: 50}}>
            Fiyatlara KDV dahildir. Abonelik süresi bitiminde otomatik yenilenmez.
        </Text>

      </ScrollView>

      {/* YÜKLENİYOR EKRANI */}
      {loading && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="white" />
            <Text style={{color:'white', marginTop:10, fontWeight:'bold'}}>İşlem Yapılıyor...</Text>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  statusCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, flexDirection:'row', justifyContent:'space-between', alignItems: 'center', marginBottom: 25, elevation: 5 },
  statusLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold' },
  statusValue: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  iconBox: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  planCard: { padding: 20, borderRadius: 16, borderWidth: 2, marginBottom: 15, position: 'relative' },
  planTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  discountBadge: { position: 'absolute', top: -10, right: 10, backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  discountText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  priceTag: { backgroundColor: '#eff6ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
  priceText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  loadingOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});