import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
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
import { useJobs } from '../context/JobContext';
import { useUI } from '../context/UIContext';

export default function JobDetailScreen({ route, navigation }) {
    const initialJob = route.params?.job;
    const jobId = initialJob?.id;

    const { theme, alertSuccess, alertError, alertWarning, alertInfo } = useUI();
    const { user, userRole } = useAuth();
    const { addOffer, acceptOffer, proConfirmJob } = useJobs(); 

    const [job, setJob] = useState(initialJob || {});
    const [realtimeOffers, setRealtimeOffers] = useState([]);
    const [acceptedOffer, setAcceptedOffer] = useState(null); // Kabul edilen teklif verisi
    const [customerInfo, setCustomerInfo] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [price, setPrice] = useState('');
    const [desc, setDesc] = useState(''); 
    const [sending, setSending] = useState(false);

    // İŞ DETAYINI CANLI DİNLE
    useEffect(() => {
        if (!jobId) return;
        const jobRef = firestore().collection('jobs').doc(jobId);

        const unsubscribe = jobRef.onSnapshot((docSnap) => {
            if (docSnap.exists) {
                setJob({ id: docSnap.id, ...docSnap.data() });
            }
        });
        return () => unsubscribe();
    }, [jobId]);

    // TEKLİFLERİ CANLI DİNLE
    useEffect(() => {
        if (!jobId) return;

        const q = firestore().collection('jobs').doc(jobId).collection('offers')
            .orderBy('price', 'asc');

        const unsubscribeOffers = q.onSnapshot((snapshot) => {
            const offersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRealtimeOffers(offersList);
        });

        return () => unsubscribeOffers();
    }, [jobId]);

    // KABUL EDİLEN TEKLİFİ BUL
    useEffect(() => {
        if (job.acceptedOfferId && realtimeOffers.length > 0) {
            const offer = realtimeOffers.find(o => o.id === job.acceptedOfferId);
            setAcceptedOffer(offer);
        }
    }, [job.acceptedOfferId, realtimeOffers]);

    // MÜŞTERİ BİLGİLERİNİ ÇEK (USTA İÇİN)
    useEffect(() => {
        if (userRole === 'pro' && job?.userId) {
            const fetchCustomer = async () => {
                try {
                    const userDoc = await firestore().collection('users').doc(job.userId).get();
                    if (userDoc.exists) {
                        setCustomerInfo(userDoc.data());
                    }
                } catch (e) {
                    console.log("Müşteri bilgisi çekilemedi", e);
                }
            };
            fetchCustomer();
        }
    }, [userRole, job?.userId]);

    const hasOffered = (realtimeOffers || []).some(offer => offer.proId === user?.uid);

    const handleSubmitOffer = async () => {
        if (!price || isNaN(price)) {
            alertError("Hata", "Lütfen geçerli bir fiyat giriniz.");
            return;
        }
        setSending(true);
        try {
            const result = await addOffer(jobId, price, desc);
            if (result.success) {
                alertSuccess("Başarılı", "Teklifiniz müşteriye iletildi! 🚀");
                setModalVisible(false);
                setPrice('');
                setDesc('');
            } else {
                alertError("Hata", result.error || "Teklif gönderilemedi.");
            }
        } catch (error) {
            alertError("Hata", "Beklenmedik bir sorun oluştu.");
        } finally {
            setSending(false);
        }
    };

    const handleAccept = async (offerId, ustaName, price) => {
        alertInfo(
            "Teklifi Onayla",
            `${ustaName} ile ${price}₺ fiyata anlaşmak istiyor musunuz?`,
            [
                { text: "Vazgeç" },
                {
                    text: "ONAYLA",
                    onPress: async () => {
                        try {
                            const success = await acceptOffer(jobId, offerId);
                            if (success) {
                                alertSuccess("Anlaşma Sağlandı!", "Usta bilgilendirildi. İş durumu 'Onay Bekliyor' olarak güncellendi.");
                            }
                        } catch (error) {
                            alertError("Hata", "Teklif kabul edilemedi.");
                        }
                    }
                }
            ]
        );
    };

    // USTA İÇİN İŞİ BAŞLATMA
    const handleStartJob = () => {
        alertInfo("İşi Başlat", "Müşteri ile anlaştıysanız ve işe başlamaya hazırsanız onaylayın.", [
            { text: "Vazgeç", style: "cancel" },
            { text: "BAŞLAT", onPress: async () => {
                const res = await proConfirmJob(jobId);
                if (res) alertSuccess("Başarılı", "İş başlatıldı! İyi çalışmalar. 🔨");
            }}
        ]);
    };

    const handleApproveJob = () => {
        alertInfo("İşi Onayla", "İşin tamamlandığını onaylıyor musunuz?", [
            { text: "Hayır", style: "cancel" },
            { text: "Evet, Onayla", onPress: async () => {
                try {
                    await firestore().collection('jobs').doc(jobId).update({ status: 'Tamamlandı' });
                    alertSuccess("Teşekkürler", "İş tamamlandı. Lütfen ustayı puanlayın.");
                } catch (e) {
                    alertError("Hata", "Güncelleme başarısız.");
                }
            }}
        ]);
    };

    const fetchUserName = async (userId) => {
        try {
            const userDoc = await firestore().collection('users').doc(userId).get();
            return userDoc.exists ? (userDoc.data().fullname || userDoc.data().name) : 'Kullanıcı';
        } catch { return 'Kullanıcı'; }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBar} />

            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>İlan Detayı</Text>
                {job?.userId === user?.uid && job?.status === 'Aktif' ? (
                    <TouchableOpacity onPress={() => navigation.navigate('EditJob', { job })} style={styles.backBtn}>
                        <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* İŞ DETAY KARTI */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.row}>
                        <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '15' }]}>
                            <Ionicons name="hammer" size={24} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: theme.text }]}>
                                {job?.serviceName || job?.category || 'Hizmet'}
                            </Text>
                            <Text style={{ color: theme.subText, fontSize: 13 }}>
                                {job?.createdAt?.seconds 
                                    ? new Date(job.createdAt.seconds * 1000).toLocaleDateString('tr-TR') 
                                    : ''}
                            </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: job?.status === 'Aktif' ? '#dcfce7' : '#fee2e2' }]}>
                            <Text style={[styles.badgeText, { color: job?.status === 'Aktif' ? '#16a34a' : '#ef4444' }]}>
                                {job?.status || 'Bilinmiyor'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <Text style={[styles.desc, { color: theme.text }]}>{job?.description || job?.desc || 'Açıklama yok'}</Text>
                    {job?.budget && (
                         <View style={[styles.budgetBox, { backgroundColor: theme.input }]}>
                             <Text style={{color: theme.subText, fontWeight:'600'}}>Müşteri Bütçesi:</Text>
                             <Text style={{color: COLORS.green, fontWeight:'bold', fontSize:16}}>{job.budget} ₺</Text>
                         </View>
                    )}
                </View>

                {/* --- KABUL EDİLEN TEKLİF (ANLAŞMA SAĞLANDIĞINDA GÖRÜNÜR) --- */}
                {(job.status === 'Onay Bekliyor' || job.status === 'Devam Ediyor') && acceptedOffer && (
                    <View style={[styles.section, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderWidth:1 }]}>
                        <Text style={[styles.sectionTitle, { color: '#0369a1' }]}>🤝 Anlaşılan Usta</Text>
                        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                            <View>
                                <Text style={{fontSize:18, fontWeight:'bold', color:'#0c4a6e'}}>{acceptedOffer.ustaName}</Text>
                                <Text style={{fontSize:16, color:'#0284c7', fontWeight:'600'}}>{acceptedOffer.price} ₺</Text>
                            </View>
                            <TouchableOpacity 
                                style={{backgroundColor:'white', padding:10, borderRadius:20}}
                                onPress={async () => {
                                    const ustaName = await fetchUserName(acceptedOffer.proId);
                                    navigation.navigate('ChatScreen', { 
                                        ustaName: ustaName, 
                                        targetUserId: acceptedOffer.proId, 
                                        jobId: jobId 
                                    });
                                }}
                            >
                                <Ionicons name="chatbubbles" size={24} color="#0284c7" />
                            </TouchableOpacity>
                        </View>
                        
                        {job.status === 'Onay Bekliyor' && (
                            <View style={{marginTop:10, padding:10, backgroundColor:'white', borderRadius:8}}>
                                <Text style={{color:'#64748b', fontSize:13, textAlign:'center'}}>
                                    Ustanın işi başlatması bekleniyor...
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* --- USTA İÇİN: MÜŞTERİ BİLGİLERİ (Sadece teklifi kabul edilen usta görsün) --- */}
                {userRole === 'pro' && job.acceptedProId === user?.uid && customerInfo && (
                    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Müşteri Bilgileri</Text>
                        <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
                             <View style={{width:50, height:50, borderRadius:25, backgroundColor:'#ddd', justifyContent:'center', alignItems:'center', marginRight:10}}>
                                 {customerInfo.photoURL ? (
                                     <Image source={{uri: customerInfo.photoURL}} style={{width:50, height:50, borderRadius:25}} />
                                 ) : (
                                     <Ionicons name="person" size={24} color="#666" />
                                 )}
                             </View>
                             <View>
                                 <Text style={{fontWeight:'bold', fontSize:16, color:theme.text}}>
                                     {customerInfo.name} {customerInfo.surname}
                                 </Text>
                                 <Text style={{color:theme.subText}}>{customerInfo.phone || "Telefon Gizli"}</Text>
                             </View>
                        </View>
                        <Text style={{color:theme.subText, fontStyle:'italic'}}>
                            Bu bilgiler sadece anlaşılan ustaya gösterilir.
                        </Text>
                    </View>
                )}

                {/* --- DETAY SORULARI (SİLİNMEMESİ GEREKEN KISIM) --- */}
                {job?.details && job.details.length > 0 && (
                    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Detaylar</Text>
                        {job.details.map((det, index) => (
                            <View key={index} style={{ marginBottom: 10 }}>
                                <Text style={{ fontWeight: 'bold', color: theme.text }}>{det.question}</Text>
                                <Text style={{ color: theme.subText }}>{det.answer}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* --- USTA İÇİN: İŞİ BAŞLAT BUTONU (Teklifi kabul edilen usta için) --- */}
                {userRole === 'pro' && job.status === 'Onay Bekliyor' && job.acceptedProId === user?.uid && (
                    <View style={{marginTop: 10, marginBottom: 20}}>
                        <View style={{padding:12, backgroundColor:'#dcfce7', borderRadius:10, marginBottom:10, borderWidth:1, borderColor:'#22c55e'}}>
                            <Text style={{color:'#166534', fontWeight:'bold', textAlign:'center', fontSize:14}}>
                                🎉 TEBRİKLER! Müşteri teklifini kabul etti!
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={[styles.offerBtn, {backgroundColor: '#16a34a'}]}
                            onPress={handleStartJob}
                        >
                            <Ionicons name="play" size={24} color="white" />
                            <Text style={styles.btnText}>🚀 İŞİ BAŞLAT</Text>
                        </TouchableOpacity>
                        <Text style={{textAlign:'center', marginTop:10, color: theme.subText, fontSize:12}}>
                            Müşteri ile anlaştıysanız ve işe hazırsanız butona basın.
                        </Text>
                    </View>
                )}

                {/* MÜŞTERİ İÇİN TESLİM ONAYI - İlan sahibi kontrolü */}
                {job.userId === user?.uid && job.status === 'Teslim Bekliyor' && (
                    <View style={{marginTop: 20}}>
                        <View style={{backgroundColor:'#f3e8ff', padding:15, borderRadius:12, marginBottom:10, borderWidth:1, borderColor:'#d8b4fe'}}>
                            <Text style={{color:'#6b21a8', fontWeight:'bold', textAlign:'center'}}>
                                Usta işi teslim etti. Onaylıyor musunuz?
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={[styles.offerBtn, {backgroundColor: COLORS.success}]}
                            onPress={handleApproveJob}
                        >
                            <Ionicons name="checkmark-done-circle" size={24} color="white" />
                            <Text style={styles.btnText}>İşi Onayla ve Puanla</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* --- GELEN TEKLİFLER (SADECE İLAN SAHİBİ VE AKTİF İSE) --- */}
                {job.userId === user?.uid && job.status === 'Aktif' && (
                    <View style={{marginTop: 20}}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Gelen Teklifler ({(realtimeOffers || []).length})
                        </Text>
                        
                        {(realtimeOffers || []).length === 0 ? (
                            <View style={{padding: 20, alignItems:'center'}}>
                                <Ionicons name="hourglass-outline" size={50} color={theme.subText} />
                                <Text style={{ color: theme.subText, marginTop: 10, textAlign:'center' }}>
                                    Henüz teklif gelmedi.
                                </Text>
                            </View>
                        ) : (
                            (realtimeOffers || []).map((offer) => (
                                <View key={offer.id} style={[styles.offerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', marginBottom: 10 }}>
                                        <View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize:16 }}>{offer.ustaName}</Text>
                                                {offer.isVerifiedBadge && (
                                                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginLeft: 5 }} />
                                                )}
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop:2 }}>
                                                <Ionicons name="star" size={14} color="#F59E0B" />
                                                <Text style={{ fontSize: 12, color: theme.subText, marginLeft: 3 }}>5.0</Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary }}>
                                            {offer.price} ₺
                                        </Text>
                                    </View>
                                    
                                    {offer.desc && (
                                        <Text style={{ marginTop: 8, color: theme.subText, fontSize: 13, fontStyle: 'italic', marginBottom: 10 }}>
                                            {offer.desc}
                                        </Text>
                                    )}

                                    <View style={{flexDirection:'row', gap:10, marginTop:12}}>
                                        <TouchableOpacity 
                                            style={[styles.acceptBtn, {flex:1, backgroundColor: '#e0f2fe'}]}
                                            onPress={async () => {
                                                const ustaName = await fetchUserName(offer.proId);
                                                navigation.navigate('ChatScreen', { 
                                                    ustaName: ustaName, 
                                                    targetUserId: offer.proId, 
                                                    jobId: jobId,
                                                    currentUserRole: 'customer'
                                                });
                                            }}
                                        >
                                            <Ionicons name="chatbubble-outline" size={18} color="#0284c7" />
                                            <Text style={{ color: '#0284c7', fontWeight: 'bold', marginLeft: 5 }}>Mesaj</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[styles.acceptBtn, {flex:1, backgroundColor: '#16a34a'}]}
                                            onPress={() => handleAccept(offer.id, offer.ustaName, offer.price)}
                                        >
                                            <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                                            <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 5 }}>Kabul Et</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}
                
                {/* DİĞER DETAYLAR (KONUM VS) */}
                <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 15 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Konum</Text>
                    <View style={styles.row}>
                        <Ionicons name="location" size={20} color={COLORS.primary} />
                        <Text style={[styles.rowText, { color: theme.subText }]}>
                            {job?.district} / {job?.city}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* USTA TEKLİF VER BUTONU (SADECE AKTİF İSE) */}
            {userRole === 'pro' && job?.status === 'Aktif' && (
                <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                    <TouchableOpacity
                        style={hasOffered ? styles.disabledBtn : styles.offerBtn}
                        onPress={() => !hasOffered && setModalVisible(true)}
                        disabled={hasOffered}
                    >
                        {hasOffered ? (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="white" />
                                <Text style={styles.btnText}>Teklif Verdiniz</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="paper-plane" size={24} color="white" />
                                <Text style={styles.btnText}>Teklif Ver</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* MODAL KODU */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Teklifini Hazırla 💰</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.label}>Fiyatın Nedir? (TL)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: 1500"
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                        />
                        <Text style={[styles.label, {marginTop:15}]}>Açıklama</Text>
                        <TextInput
                            style={[styles.input, {height: 80, textAlignVertical:'top'}]}
                            placeholder="Opsiyonel..."
                            multiline
                            value={desc}
                            onChangeText={setDesc}
                        />
                        <TouchableOpacity 
                            style={[styles.submitBtn, { opacity: sending ? 0.7 : 1 }]} 
                            onPress={handleSubmitOffer}
                            disabled={sending}
                        >
                            {sending ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Gönder</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 5 },
    card: { borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
    desc: { fontSize: 15, lineHeight: 22 },
    budgetBox: { marginTop:15, padding:10, borderRadius:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    section: { borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    rowText: { fontSize: 15, fontWeight: '500', marginLeft: 10 },
    offerCard: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 12, elevation: 1 },
    acceptBtn: { padding: 12, borderRadius: 8, alignItems: 'center', justifyContent:'center', flexDirection: 'row' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, elevation: 10 },
    offerBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    disabledBtn: { backgroundColor: '#94a3b8', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    label: { fontWeight: 'bold', marginBottom: 8, color: '#333' },
    input: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
    submitBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});