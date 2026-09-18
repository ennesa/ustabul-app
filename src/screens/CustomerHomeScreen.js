import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import firestore from '@react-native-firebase/firestore';
import { useEffect } from 'react';
import {
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

// Bildirim Ayarı (Uygulama açıkken gelirse)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function CustomerHomeScreen({ navigation }) {
  const { theme, customerUnreadCount, services } = useUI();
  const { user, customerProfile, getBalance } = useAuth();

  // --- BİLDİRİM İZNİ VE TOKEN ALMA ---
  useEffect(() => {
    const registerForPushNotifications = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') return;

        // Project ID kontrolü (Hata almamak için güvenli erişim)
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
        
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        });
        
        if (user && tokenData.data) {
            await firestore().collection('users').doc(user.uid).update({ pushToken: tokenData.data });
        }
      } catch (error) {
        console.log("Token Hatası (Önemsiz):", error.message);
      }
    };

    if (user) {
        registerForPushNotifications();
    }
  }, [user]);

  // Günün saatine göre selamlama
  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Günaydın";
      if (hour < 18) return "Tünaydın";
      return "İyi Akşamlar";
  };

  const handleCategorySelect = (category) => {
      navigation.navigate('CreateJob', { initialCategory: category.name });
  };

  // ✅ YENİ: Kategori Kartı Render Fonksiyonu
  const renderCategory = ({ item }) => (
    <TouchableOpacity 
        style={[styles.categoryCard, {backgroundColor: theme.card}]}
        onPress={() => handleCategorySelect(item)}
    >
        <View style={[styles.iconBox, {backgroundColor: item.bg || '#f3f4f6'}]}>
            <Ionicons name={item.icon} size={32} color={item.color} />
        </View>
        <Text style={[styles.categoryText, {color: theme.text}]}>{item.name}</Text>
    </TouchableOpacity>
  );

  // ✅ YENİ: Sayfa Başlığı (Header + Banner)
  const renderHeader = () => (
    <View>
        {/* --- 1. HEADER (Selamlama + Cüzdan + Bildirim) --- */}
        <View style={styles.header}>
            <View>
                <Text style={{color: theme.subText, fontSize: 14}}>{getGreeting()}, 👋</Text>
                <Text style={{color: theme.text, fontSize: 20, fontWeight: 'bold'}}>
                    {customerProfile?.name || 'Misafir'}
                </Text>
            </View>
            
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                {/* 💰 Cüzdan Butonu */}
                <TouchableOpacity 
                    style={styles.walletBtn}
                    onPress={() => navigation.navigate('CustomerWallet')}
                >
                    <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
                    <Text style={{color: COLORS.primary, fontWeight: 'bold', marginLeft: 5}}>
                        {getBalance()} ₺
                    </Text>
                </TouchableOpacity>

                {/* 🔔 Bildirim Zili */}
                <TouchableOpacity 
                    style={{padding: 8}} 
                    onPress={() => navigation.navigate('NotificationScreen', { role: 'customer' })}
                >
                    <Ionicons name="notifications-outline" size={28} color={theme.text} />
                    
                    {customerUnreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{customerUnreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>

        {/* --- 2. BANNER --- */}
        <View style={{paddingHorizontal: 20, marginBottom: 20}}>
            <View style={styles.bannerCard}>
                <View style={{flex:1}}>
                    <Text style={styles.bannerTitle}>Eviniz için en iyi ustalar burada!</Text>
                    <Text style={styles.bannerSub}>Hemen ücretsiz ilan ver, teklifleri topla.</Text>
                    <TouchableOpacity 
                        style={styles.bannerBtn}
                        onPress={() => navigation.navigate('CreateJob')}
                    >
                        <Text style={{color: COLORS.primary, fontWeight:'bold'}}>İlan Oluştur</Text>
                    </TouchableOpacity>
                </View>
                <Ionicons name="construct" size={80} color="rgba(255,255,255,0.2)" />
            </View>
        </View>

        {/* --- 3. BAŞLIK --- */}
        <Text style={[styles.sectionTitle, {color: theme.text}]}>Hizmet Kategorileri</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar barStyle={theme.statusBar} />
      
      {/* ✅ DEĞİŞİKLİK: ScrollView yerine FlatList kullanıldı */}
      <FlatList
        data={services}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        numColumns={2} // Çift sütun görünümü
        ListHeaderComponent={renderHeader} // Üst kısımlar buraya taşındı
        columnWrapperStyle={styles.columnWrapper} // Sütunlar arası boşluk
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
      flex: 1, 
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: 20, 
      paddingBottom: 10 
  },
  // Banner Stilleri
  bannerCard: {
      backgroundColor: COLORS.primary, 
      borderRadius: 20, 
      padding: 20, 
      flexDirection:'row', 
      alignItems:'center', 
      justifyContent:'space-between', 
      elevation:5, 
      shadowColor: COLORS.primary, 
      shadowOpacity:0.3
  },
  bannerTitle: { color:'white', fontSize:18, fontWeight:'bold', marginBottom:5 },
  bannerSub: { color:'rgba(255,255,255,0.9)', fontSize:13 },
  bannerBtn: { backgroundColor:'white', paddingVertical:8, paddingHorizontal:15, borderRadius:10, alignSelf:'flex-start', marginTop:15 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },
  
  // ✅ YENİ: Sütun Düzeni (FlatList için)
  columnWrapper: {
      justifyContent: 'space-between',
      paddingHorizontal: 15 // Kenarlardan boşluk (Eski categoryList padding'i)
  },
  
  categoryCard: { 
      width: '48%', 
      aspectRatio: 1, 
      padding: 15, 
      borderRadius: 20, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginBottom: 15, 
      elevation: 3, 
      shadowColor:'#000', 
      shadowOpacity:0.1, 
      shadowRadius:5,
      borderWidth: 1,
      borderColor: 'transparent'
  },
  iconBox: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10
  },
  categoryText: {
      fontWeight: 'bold',
      fontSize: 16
  },
  // Bildirim Rozeti Stili
  badge: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: '#ef4444',
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'white' 
  },
  badgeText: {
      color: 'white',
      fontSize: 9,
      fontWeight: 'bold',
      paddingHorizontal: 2
  },
  walletBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#e0f2fe',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
  }
});