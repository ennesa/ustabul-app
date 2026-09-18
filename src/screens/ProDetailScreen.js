// =====================================================
// 👷 USTA DETAY EKRANI - GÜNCELLENMİŞ VERSİYON
// =====================================================
// Yeni: Portföy Galerisi, Tab Menüsü
// =====================================================

import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, Image, ScrollView, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { PortfolioGallery } from '../components/PortfolioGallery';

export default function ProDetailScreen({ route, navigation }) {
    const { proId } = route.params; 
    const { theme } = useUI();
    const { user } = useAuth(); 

    const [proData, setProData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');

    useEffect(() => {
        const fetchProData = async () => {
            if (!proId) return;
            try {
                const docSnap = await firestore().collection('users').doc(proId).get();
                if (docSnap.exists) setProData(docSnap.data());
            } catch (error) {
                console.error("Hata:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProData();
    }, [proId]);

    const handleSendMessage = () => {
        if (!user) return;
        // Döngüyü engellemek için replace kullan
        navigation.replace('ChatScreen', {
            targetUserId: proId,
            ustaName: proData?.fullname || proData?.name || "Usta",
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, {backgroundColor: theme.background, justifyContent:'center', alignItems:'center'}]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (!proData) {
        return (
            <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
                <Text style={{textAlign:'center', marginTop:50, color: theme.text}}>Kullanıcı bulunamadı.</Text>
            </SafeAreaView>
        );
    }

    const rating = proData.rating || 0;
    const reviewCount = proData.reviewCount || 0;
    const isVerified = proData.isVerified || proData.isVerifiedBadge || false;
    const portfolio = proData.portfolio || [];
    const isPro = proData.role === 'pro'; // Kullanıcı usta mı?

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, {color: theme.text}]}>
                    {isPro ? 'Usta Profili' : 'Müşteri Profili'}
                </Text>
                <View style={{width:24}} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Profil Kartı */}
                <View style={[styles.profileCard, {backgroundColor: theme.card}]}>
                    <View style={styles.avatarContainer}>
                        {proData.photo ? (
                            <Image source={{uri: proData.photo}} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, {backgroundColor: '#e2e8f0', justifyContent:'center', alignItems:'center'}]}>
                                <Ionicons name="person" size={40} color="#94a3b8" />
                            </View>
                        )}
                        {isVerified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={18} color="white" />
                            </View>
                        )}
                    </View>
                    
                    <Text style={[styles.name, {color: theme.text}]}>
                        {proData.fullname || proData.name || "Usta"}
                    </Text>
                    
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={18} color="#f59e0b" />
                        <Text style={[{fontWeight:'bold', marginLeft:5, color: theme.text}]}>
                            {Number(rating).toFixed(1)}
                        </Text>
                        <Text style={{color: theme.subText, marginLeft:5}}>({reviewCount} yorum)</Text>
                    </View>

                    <View style={[styles.statsRow, {borderTopColor: theme.border}]}>
                        {isPro && (
                            <>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, {color: theme.text}]}>{proData.completedJobsCount || 0}</Text>
                                    <Text style={{color: theme.subText, fontSize:12}}>İş</Text>
                                </View>
                                <View style={{width:1, backgroundColor: theme.border}} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, {color: theme.text}]}>{portfolio.length}</Text>
                                    <Text style={{color: theme.subText, fontSize:12}}>Portföy</Text>
                                </View>
                                <View style={{width:1, backgroundColor: theme.border}} />
                            </>
                        )}
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, {color: theme.text}]}>{proData.city || "-"}</Text>
                            <Text style={{color: theme.subText, fontSize:12}}>Konum</Text>
                        </View>
                    </View>
                </View>

                {/* Tab Menüsü */}
                <View style={[styles.tabContainer, {backgroundColor: theme.card}]}>
                    {(isPro ? ['about', 'portfolio', 'reviews'] : ['about']).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Ionicons
                                name={tab === 'about' ? 'person-outline' : tab === 'portfolio' ? 'images-outline' : 'chatbubbles-outline'}
                                size={18}
                                color={activeTab === tab ? COLORS.primary : theme.subText}
                            />
                            <Text style={{color: activeTab === tab ? COLORS.primary : theme.subText, marginLeft:5, fontSize:13}}>
                                {tab === 'about' ? 'Hakkında' : tab === 'portfolio' ? 'Portföy' : 'Yorumlar'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tab İçeriği */}
                <View style={{padding: 20}}>
                    {activeTab === 'about' && (
                        <View style={[styles.section, {backgroundColor: theme.card}]}>
                            <Text style={[styles.sectionTitle, {color: theme.text}]}>Hakkında</Text>
                            <Text style={{color: theme.subText, lineHeight:22}}>
                                {proData.bio || "Henüz bilgi girilmemiş."}
                            </Text>
                        </View>
                    )}

                    {isPro && activeTab === 'portfolio' && (
                        <View style={[styles.section, {backgroundColor: theme.card}]}>
                            <Text style={[styles.sectionTitle, {color: theme.text}]}>Portföy</Text>
                            <PortfolioGallery images={portfolio} theme={theme} />
                        </View>
                    )}

                    {isPro && activeTab === 'reviews' && (
                        <View style={[styles.section, {backgroundColor: theme.card}]}>
                            <Text style={[styles.sectionTitle, {color: theme.text}]}>Değerlendirmeler</Text>
                            {(!proData.reviews || proData.reviews.length === 0) ? (
                                <Text style={{color: theme.subText, fontStyle:'italic'}}>Henüz yorum yok.</Text>
                            ) : (
                                proData.reviews.map((rev, i) => (
                                    <View key={i} style={{marginBottom:15, borderBottomWidth:1, borderColor: theme.border, paddingBottom:10}}>
                                        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                                            <Text style={{fontWeight:'bold', color: theme.text}}>{rev.customerName || "Müşteri"}</Text>
                                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                                <Ionicons name="star" size={14} color="#f59e0b"/>
                                                <Text style={{marginLeft:3, color:theme.text}}>{rev.rating}</Text>
                                            </View>
                                        </View>
                                        <Text style={{color: theme.subText, marginTop:5}}>{rev.comment}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
            
            {/* Footer */}
            <View style={[styles.footer, {backgroundColor: theme.background, borderColor: theme.border}]}>
                <TouchableOpacity style={styles.messageBtn} onPress={handleSendMessage}>
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="white" />
                    <Text style={styles.messageBtnText}>Mesaj Gönder</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent:'space-between', alignItems: 'center', padding: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    profileCard: { alignItems:'center', padding: 20, marginHorizontal: 20, marginTop: 10, borderRadius: 16, elevation: 2 },
    avatarContainer: { position:'relative', marginBottom: 12 },
    avatar: { width: 90, height: 90, borderRadius: 45 },
    verifiedBadge: { position:'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 10, width: 20, height: 20, justifyContent:'center', alignItems:'center', borderWidth: 2, borderColor:'white' },
    name: { fontSize: 20, fontWeight:'bold', marginBottom: 5 },
    ratingRow: { flexDirection:'row', alignItems:'center', marginTop: 5 },
    statsRow: { flexDirection:'row', borderTopWidth: 1, paddingTop: 15, marginTop: 15, width:'100%', justifyContent:'space-around' },
    statItem: { alignItems:'center', flex: 1 },
    statValue: { fontWeight:'bold', fontSize: 16 },
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 15, borderRadius: 12, overflow: 'hidden' },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    activeTab: { backgroundColor: 'rgba(0, 122, 255, 0.1)' },
    section: { padding: 15, borderRadius: 12 },
    sectionTitle: { fontSize: 16, fontWeight:'bold', marginBottom: 10 },
    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, borderTopWidth: 1 },
    messageBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 12, gap: 8 },
    messageBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
