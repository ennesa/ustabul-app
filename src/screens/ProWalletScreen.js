import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export default function ProWalletScreen({ navigation }) {
  const { theme } = useUI();
  const { user, userProfile } = useAuth(); 
  
  const [loading, setLoading] = useState(true);
  const [completedJobs, setCompletedJobs] = useState([]);

  // Cüzdan bakiyesi artık "Toplam Tahmini Kazanç" olarak gösterilecek
  const totalEarnings = userProfile?.walletBalance ?? 0;

  // Tamamlanan işlerin listesini çek
  useEffect(() => {
    if (!user) return;

    // Sadece "Completed" (Tamamlandı) olan son 50 işi getiriyoruz (İstatistik için)
    const unsubscribe = firestore()
        .collection('jobs')
        .where('assignedProId', '==', user.uid)
        .where('status', '==', 'Completed')
        .orderBy('updatedAt', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            const jobs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCompletedJobs(jobs);
            setLoading(false);
        }, (error) => {
            console.error("Kazanç geçmişi hatası:", error);
            setLoading(false);
        });

    return () => unsubscribe();
  }, [user]);

  // Liste Elemanı (Geçmiş İş)
  const renderTransaction = ({ item }) => (
    <View style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="checkmark-done" size={24} color={COLORS.success} />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[styles.jobTitle, { color: theme.text }]} numberOfLines={1}>
                {item.serviceName || "Hizmet"}
            </Text>
            <Text style={{ color: theme.subText, fontSize: 12 }}>
                {item.updatedAt?.toDate().toLocaleDateString('tr-TR') || "Tarih yok"}
            </Text>
        </View>
        <Text style={[styles.amountText, { color: COLORS.success }]}>
            +{item.acceptedPrice} ₺
        </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Kazanç İstatistikleri</Text>
        <Ionicons name="stats-chart" size={24} color={COLORS.primary} />
      </View>

      <View style={styles.content}>
        
        {/* İSTATİSTİK KARTI (ÖDEME ALMA YERİ DEĞİL) */}
        <View style={styles.statsCard}>
            <View>
                <Text style={styles.statsLabel}>Toplam Tahmini Kazanç</Text>
                <Text style={styles.statsValue}>{totalEarnings} ₺</Text>
            </View>
            <View style={styles.statsDivider} />
            <View>
                <Text style={styles.statsLabel}>Tamamlanan İş</Text>
                <Text style={styles.statsValue}>{completedJobs.length}</Text>
            </View>
        </View>

        {/* BİLGİLENDİRME KUTUSU */}
        <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#854d0e" />
            <Text style={styles.infoText}>
                Bu ekran sadece istatistik amaçlıdır. Ödemeler müşteri tarafından elden veya anlaşılan yöntemle yapılır. Uygulama üzerinden para transferi yapılmaz.
            </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Son Tamamlanan İşler</Text>

        <FlatList
            data={completedJobs}
            keyExtractor={item => item.id}
            renderItem={renderTransaction}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
                <View style={{alignItems:'center', marginTop:50, opacity:0.5}}>
                    <Ionicons name="document-text-outline" size={60} color={theme.subText} />
                    <Text style={{color:theme.subText, marginTop:10}}>Henüz tamamlanmış iş kaydı yok.</Text>
                </View>
            }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  
  content: { flex: 1, padding: 20 },

  // İSTATİSTİK KARTI
  statsCard: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 20, 
    padding: 25, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    elevation: 8, 
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 20 
  },
  statsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  statsValue: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 5, textAlign: 'center' },
  statsDivider: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.3)' },

  // BİLGİ KUTUSU
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fef9c3', // Açık sarı
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#fde047',
    alignItems: 'flex-start',
    gap: 10
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#854d0e', // Koyu sarı/kahve yazı
    lineHeight: 18
  },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },

  // LİSTE ELEMANI
  transactionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 10, 
    borderWidth: 1 
  },
  iconBox: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  jobTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  amountText: { fontSize: 16, fontWeight: 'bold' }
});