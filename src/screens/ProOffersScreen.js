import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export default function ProOffersScreen({ navigation }) {
    const { user } = useAuth();
    const { theme, alertSuccess, alertError, alertWarning, alertInfo } = useUI();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');

    const [cachedJobs, setCachedJobs] = useState({
        Offers: [],
        Active: [],
        History: []
    });

    const [loadedTabs, setLoadedTabs] = useState({
        Offers: false,
        Active: false,
        History: false
    });
    
    const [activeTab, setActiveTab] = useState('Offers'); 

    useEffect(() => {
        if (!user) return;

        if (loadedTabs[activeTab] && !refreshing) {
            setLoading(false);
            return;
        }

        setLoading(true);

        let queryRef;

        try {
            if (activeTab === 'Offers') {
                queryRef = firestore()
                    .collection('jobs')
                    .where('offeredProIds', 'array-contains', user.uid)
                    .where('status', '==', 'Aktif')
                    .orderBy('createdAt', 'desc');
            }
            else if (activeTab === 'Active') {
                queryRef = firestore()
                    .collection('jobs')
                    .where('acceptedProId', '==', user.uid)
                    .where('status', 'in', ['Onay Bekliyor', 'Devam Ediyor', 'Teslim Bekliyor']);
            }
            else {
                queryRef = firestore()
                    .collection('jobs')
                    .where('acceptedProId', '==', user.uid)
                    .where('status', 'in', ['Tamamlandı', 'Değerlendirildi', 'İptal']);
            }

            const unsubscribe = queryRef.onSnapshot((snapshot) => {
                const fetchedJobs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                if (activeTab !== 'Offers') {
                    fetchedJobs.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                }

                setCachedJobs(prev => ({
                    ...prev,
                    [activeTab]: fetchedJobs
                }));

                setLoadedTabs(prev => ({
                    ...prev,
                    [activeTab]: true
                }));

                setLoading(false);
                setRefreshing(false);
            }, (error) => {
                console.error("Firebase Sorgu Hatası:", error);
                if (error.code === 'failed-precondition') {
                    console.log("⚠️ EKSİK INDEX: Terminaldeki linke tıklayarak index oluşturun.");
                }
                setLoading(false);
                setRefreshing(false);
            });

            return () => unsubscribe();

        } catch (err) {
            console.error("Query oluşturma hatası:", err);
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, activeTab, refreshing]); 

    const onRefresh = () => {
        setRefreshing(true);
    };

    const handleStartJob = (job) => {
        alertInfo("İşi Başlat", "Müşteri seni seçti. İşe başlamaya hazır mısın?", [
            { text: "Vazgeç", style: "cancel" },
            { text: "BAŞLAT", onPress: async () => {
                try {
                    await firestore().collection('jobs').doc(job.id).update({
                        status: 'Devam Ediyor',
                        proStartedAt: firestore.FieldValue.serverTimestamp()
                    });
                    onRefresh();
                    alertSuccess("Başarılı", "İş durumu 'Devam Ediyor' olarak güncellendi.");
                } catch (e) {
                    alertError("Hata", "İş başlatılamadı.");
                }
            }}
        ]);
    };

    const handleFinishJob = (job) => {
        alertInfo("İşi Teslim Et", "İşi tamamladın mı?", [
            { text: "Hayır", style: "cancel" },
            { text: "Evet, Bitirdim", onPress: async () => {
                try {
                    await firestore().collection('jobs').doc(job.id).update({
                        status: 'Teslim Bekliyor',
                        proFinishedAt: firestore.FieldValue.serverTimestamp()
                    });
                    onRefresh();
                    alertSuccess("Tebrikler", "İş teslim edildi, müşteri onayı bekleniyor.");
                } catch (e) {
                    alertError("Hata", "Güncelleme yapılamadı.");
                }
            }}
        ]);
    };

    const renderJobItem = ({ item }) => {
        return (
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('JobDetail', { job: item })}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:5}}>
                    <Text style={[styles.jobTitle, { color: theme.text }]} numberOfLines={1}>{item.serviceName || item.title}</Text>
                    <Text style={{fontSize:12, color: theme.subText}}>
                         {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : ''}
                    </Text>
                </View>

                <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
                    <Ionicons name="location-sharp" size={14} color={COLORS.primary} />
                    <Text style={{color: theme.subText, fontSize:13, marginLeft:5}}>{item.city} / {item.district}</Text>
                </View>

                {item.budget && (
                    <View style={[styles.infoRow, {backgroundColor: theme.background}]}>
                         <Text style={{color: theme.subText}}>Bütçe:</Text>
                         <Text style={{fontWeight:'bold', color: COLORS.primary}}>{item.budget} ₺</Text>
                    </View>
                )}
                
                {activeTab === 'Offers' && (
                    <View style={{marginTop:10}}>
                        <Text style={{fontSize:12, color:'#d97706', fontStyle:'italic'}}>⏳ Teklifiniz iletildi, müşterinin seçimi bekleniyor...</Text>
                        <TouchableOpacity 
                            style={[styles.actionBtn, {backgroundColor: '#e0f2fe', marginTop:8}]}
                            onPress={() => navigation.navigate('ChatScreen', { ustaName: 'Müşteri', targetUserId: item.userId, jobId: item.id })}
                        >
                            <Text style={{color:'#0284c7', fontWeight:'bold'}}>Müşteriye Mesaj Yaz</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeTab === 'Active' && (
                    <View style={{marginTop:10}}>
                        {item.status === 'Onay Bekliyor' && (
                            <View>
                                <View style={styles.alertBox}>
                                    <Text style={{color:'#166534', fontWeight:'bold'}}>🎉 Tebrikler! Seçildiniz.</Text>
                                    <Text style={{color:'#166534', fontSize:12}}>İşe başlamak için aşağıdaki butona basın.</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleStartJob(item)} style={[styles.mainBtn, {backgroundColor: COLORS.green}]}>
                                    <Text style={styles.btnText}>🚀 İşi Başlat</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {item.status === 'Devam Ediyor' && (
                            <View>
                                <View style={[styles.alertBox, {backgroundColor:'#eff6ff', borderColor:'#bfdbfe'}]}>
                                    <Text style={{color:'#1e40af', fontWeight:'bold'}}>🔨 Çalışılıyor</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleFinishJob(item)} style={[styles.mainBtn, {backgroundColor: COLORS.primary}]}>
                                    <Text style={styles.btnText}>🎁 İşi Bitirdim / Teslim Et</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {item.status === 'Teslim Bekliyor' && (
                            <View style={[styles.alertBox, {backgroundColor:'#f3e8ff', borderColor:'#d8b4fe'}]}>
                                <Text style={{color:'#6b21a8', fontWeight:'bold'}}>🎁 Teslim Edildi</Text>
                                <Text style={{color:'#6b21a8', fontSize:12}}>Müşterinin onayı bekleniyor.</Text>
                            </View>
                        )}
                        <TouchableOpacity 
                             style={{marginTop:10, alignItems:'center', flexDirection:'row', justifyContent:'center'}}
                             onPress={() => navigation.navigate('ChatScreen', { ustaName: 'Müşteri', targetUserId: item.userId, jobId: item.id })}
                        >
                             <Ionicons name="chatbubble-outline" size={18} color={theme.subText} />
                             <Text style={{color: theme.subText, marginLeft:5}}>Müşteriyle Görüş</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeTab === 'History' && (
                     <View style={{marginTop:10}}>
                         <View style={[styles.alertBox, {backgroundColor:'#f0fdf4', borderColor:'#bbf7d0'}]}>
                             <Text style={{color:'#166534', fontWeight:'bold'}}>✅ {item.status}</Text>
                         </View>
                     </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
    <View style={styles.emptyContainer}>
        <View style={[styles.iconCircle, {backgroundColor: theme.input}]}>
            <Ionicons 
                name={activeTab === 'Offers' ? "document-text-outline" : activeTab === 'Active' ? "hammer-outline" : "trophy-outline"} 
                size={50} 
                color={theme.subText} 
            />
        </View>
        <Text style={[styles.emptyTitle, {color: theme.text}]}>
            {activeTab === 'Offers' ? 'Henüz Teklifin Yok' : activeTab === 'Active' ? 'Aktif İşin Yok' : 'Tamamlanan İş Yok'}
        </Text>
        <Text style={[styles.emptySub, {color: theme.subText}]}>
            {activeTab === 'Offers' 
                ? 'Ana sayfadaki işlere teklif vererek kazanmaya başla! 🚀' 
                : activeTab === 'Active' 
                    ? 'Tekliflerin kabul edildiğinde işler burada görünecek.' 
                    : 'Tamamladığın işler burada listelenir.'}
        </Text>
        
        {/* ✅ ÇÖZÜM: Doğru Tab adıyla navigate */}
        {activeTab === 'Offers' && (
            <TouchableOpacity 
                style={styles.emptyActionBtn} 
                onPress={() => {
                    // ProTabs içindeki "İş Fırsatları" tab'ına git
                    navigation.navigate('İş Fırsatları');
                }}
            >
                <Text style={{color:'white', fontWeight:'bold'}}>İş Ara</Text>
            </TouchableOpacity>
        )}
    </View>
);

    // ✅ [6] FİLTRELEME MANTĞI
    const getFilteredJobs = () => {
        const jobs = cachedJobs[activeTab] || [];
        if (!searchText.trim()) return jobs;
        return jobs.filter(job => 
            (job.city && job.city.toLowerCase().includes(searchText.toLowerCase())) ||
            (job.district && job.district.toLowerCase().includes(searchText.toLowerCase()))
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={theme.statusBar} />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, {color: theme.text}]}>İşlerim & Tekliflerim</Text>
            </View>

            {/* ✅ [6] ŞEHİR ARAMA FİLTRESİ */}
            <View style={{paddingHorizontal: 20, marginBottom: 10}}>
                <View style={[styles.searchBar, {backgroundColor: theme.input}]}>
                    <Ionicons name="search" size={20} color={theme.subText} />
                    <TextInput 
                        placeholder="Şehir veya İlçe Ara..." 
                        placeholderTextColor={theme.subText}
                        style={{flex:1, marginLeft:10, color: theme.text}}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={20} color={theme.subText} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.tabContainer}>
                {['Offers', 'Active', 'History'].map(tab => (
                    <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab === 'Offers' ? 'Teklifler' : tab === 'Active' ? 'Aktif İşler' : 'Geçmiş'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop:50}} />
            ) : (
                <FlatList
                    data={getFilteredJobs()}
                    keyExtractor={item => item.id}
                    renderItem={renderJobItem}
                    contentContainerStyle={{ padding: 15, paddingBottom: 100, flexGrow: 1 }}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { padding: 20, paddingTop: 10 },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
    },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: COLORS.primary },
    tabText: { fontSize: 14, color: '#94a3b8', fontWeight: 'bold' },
    activeTabText: { color: COLORS.primary },
    
    card: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, elevation: 2 },
    jobTitle: { fontSize: 16, fontWeight: 'bold', maxWidth: '75%' },
    infoRow: { padding: 8, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    
    actionBtn: { padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    mainBtn: { padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    btnText: { color: 'white', fontWeight: 'bold' },
    
    alertBox: { padding: 10, borderRadius: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 5 },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
    iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    emptySub: { textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 20 },
    emptyActionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 }
});