import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
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

export default function ProScreen({ navigation }) {
    const { user, userProfile } = useAuth();
    const { theme, proUnreadCount } = useUI(); // cities kaldırıldı

    const [loading, setLoading] = useState(true);
    const [rawJobs, setRawJobs] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        const registerForPushNotifications = async () => {
          try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            if (existingStatus !== 'granted') return;

            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            
            if (!projectId) return;

            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: projectId });

            if (user?.uid && tokenData.data) {
                await firestore().collection('users').doc(user.uid).update({ pushToken: tokenData.data });
            }
          } catch (e) {
              console.log("Token Hatası (Önemsiz):", e.message);
          }
        };
        if (user) registerForPushNotifications();
    }, [user]);

    // ✅ DÜZELTİLDİ: Şehir filtresi kaldırıldı, sadece Aktif işler çekiliyor
    useEffect(() => {
        setLoading(true);
        const q = firestore().collection('jobs')
            .where('status', '==', 'Aktif')
            .orderBy('createdAt', 'desc')
            .limit(50);

        const unsubscribe = q.onSnapshot((snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setRawJobs(fetched);
            setLoading(false);
        }, (error) => {
            console.error("Veri çekme hatası:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []); // selectedCity bağımlılığı kaldırıldı

    // ✅ Yetenek + Şehir Araması Filtresi
    const jobs = useMemo(() => {
        return rawJobs.filter(job => {
            // 1. Yetenek Kontrolü
            if (!userProfile?.skills || userProfile.skills.length === 0) return false; 
            
            const matchesService = userProfile?.skills?.includes(job.serviceId) ?? false;
            const matchesCategory = userProfile?.skills?.includes(job.category) ?? false;
            
            const matchesSkill = matchesService || matchesCategory;
            
            // 2. Şehir Arama Kontrolü
            if (searchText.trim()) {
                const searchLower = searchText.toLowerCase();
                const cityMatch = job.city?.toLowerCase().includes(searchLower);
                const districtMatch = job.district?.toLowerCase().includes(searchLower);
                return matchesSkill && (cityMatch || districtMatch);
            }
            
            return matchesSkill;
        });
    }, [rawJobs, userProfile?.skills, searchText]);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const renderJobItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('JobDetail', { job: item })}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.jobTitle, { color: theme.text }]}>
                    {item.serviceName || item.title || item.category || 'Hizmet'}
                </Text>
                <Text style={styles.priceTag}>{item.budget ? `${item.budget} ₺` : 'Teklif Usulü'}</Text>
            </View>
            <Text style={[styles.jobDesc, { color: theme.subText }]} numberOfLines={2}>{item.description || item.desc || ''}</Text>
            <View style={styles.cardFooter}>
                <View style={styles.infoBadge}>
                    <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.infoText}>{item.district || 'İlçe'} / {item.city || 'Şehir'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBar} />

            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>İş Fırsatları 🚀</Text>
                    <Text style={{ color: theme.subText, fontSize: 12 }}>
                        {userProfile?.skills?.length > 0 
                            ? "Sadece uzmanlık alanına uygun ilanlar." 
                            : "⚠️ İlanları görmek için profilinden uzmanlık ekle!"}
                    </Text>
                </View>
                
                <TouchableOpacity onPress={() => navigation.navigate('NotificationScreen', { role: 'pro' })} style={styles.notifBtn}>
                    <Ionicons name="notifications-outline" size={26} color={theme.text} />
                    {proUnreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{proUnreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* ✅ ŞEHİR ARAMA KUTUSU */}
            <View style={{paddingHorizontal: 20, marginBottom: 15}}>
                <View style={[styles.searchBar, {backgroundColor: theme.input, borderColor: theme.border}]}>
                    <Ionicons name="search" size={20} color={theme.subText} />
                    <TextInput 
                        placeholder="Şehir veya İlçe Ara ( İstanbul, Kadıköy)..." 
                        placeholderTextColor={theme.subText}
                        style={{flex:1, marginLeft:10, color: theme.text, fontSize: 14}}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={20} color={theme.subText} />
                        </TouchableOpacity>
                    )}
                </View>
                
                {/* Arama sonuç sayısı */}
                {searchText.trim() && (
                    <Text style={{color: theme.subText, fontSize: 12, marginTop: 8, marginLeft: 5}}>
                        {jobs.length} iş bulundu
                    </Text>
                )}
            </View>

            {/* İÇERİK */}
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderJobItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            {(!userProfile?.skills || userProfile.skills.length === 0) ? (
                                <>
                                    <Ionicons name="construct-outline" size={60} color="#f59e0b" />
                                    <Text style={{ color: theme.text, marginTop: 10, fontWeight:'bold', fontSize:16 }}>Uzmanlık Alanı Seçilmedi</Text>
                                    <Text style={{ color: theme.subText, textAlign:'center', marginTop: 5 }}>
                                        İlanları görmek için lütfen {"\n"}Profil {'>'} Uzmanlık Alanları kısmından{"\n"}yeteneklerinizi ekleyin.
                                    </Text>
                                    <TouchableOpacity 
                                        style={styles.addSkillBtn}
                                        onPress={() => navigation.navigate('ProProfile')}
                                    >
                                        <Text style={{color:'white', fontWeight:'bold'}}>Profili Düzenle</Text>
                                    </TouchableOpacity>
                                </>
                            ) : searchText.trim() ? (
                                <>
                                    <Ionicons name="search" size={60} color={theme.border} />
                                    <Text style={{ color: theme.text, marginTop: 10, fontWeight:'bold', fontSize:16 }}>
                                        {searchText} için sonuç bulunamadı
                                    </Text>
                                    <Text style={{ color: theme.subText, textAlign:'center', marginTop: 5 }}>
                                        Farklı bir şehir veya ilçe deneyin.
                                    </Text>
                                    <TouchableOpacity 
                                        style={styles.addSkillBtn}
                                        onPress={() => setSearchText('')}
                                    >
                                        <Text style={{color:'white', fontWeight:'bold'}}>Aramayı Temizle</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="search" size={60} color={theme.border} />
                                    <Text style={{ color: theme.subText, marginTop: 10, textAlign:'center' }}>
                                        Uzmanlığına uygun aktif iş bulunamadı.
                                    </Text>
                                </>
                            )}
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    notifBtn: { padding: 5, position: 'relative' },
    
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    
    card: { padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    jobTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 10 },
    priceTag: { backgroundColor: '#dcfce7', color: '#16a34a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
    jobDesc: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
    cardFooter: { flexDirection: 'row', gap: 10 },
    infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(37, 99, 235, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    infoText: { fontSize: 12, color: COLORS.primary, marginLeft: 4, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.8, padding:20 },
    addSkillBtn: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    badge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'white' },
    badgeText: { color: 'white', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 2 }
});