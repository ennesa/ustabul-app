import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
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
import { sendPushNotification } from '../utils/pushNotificationHelper';

const StatusBadge = ({ status }) => {
    let color = '#fbbf24'; 
    let text = status || 'Aktif';

    if (status === 'Devam Ediyor') { color = '#3b82f6'; text = 'Çalışılıyor 🔨'; }
    else if (status === 'Teslim Bekliyor') { color = '#8b5cf6'; text = 'Teslim Edildi 🎁'; }
    else if (status === 'Tamamlandı') { color = '#22c55e'; text = 'Tamamlandı ✅'; }
    else if (status === 'Onay Bekliyor') { color = '#f97316'; text = 'Onay Bekliyor ⏳'; }
    else if (status === 'Değerlendirildi') { color = '#10b981'; text = 'Değerlendirildi ⭐'; }
    else if (status === 'İptal') { color = '#ef4444'; text = 'İptal Edildi ❌'; }
    
    return (
        <View style={{backgroundColor: color + '20', paddingHorizontal:8, paddingVertical:4, borderRadius:6, borderWidth:1, borderColor: color}}>
            <Text style={{color: color, fontSize:10, fontWeight:'bold'}}>{text}</Text>
        </View>
    );
};

export default function MyJobsScreen({ navigation }) {
  const { user, userProfile, userRole } = useAuth();
  const { theme, sendNotification, alertSuccess, alertError, alertWarning, alertInfo } = useUI();
  const { acceptOffer } = useJobs(); 

  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Teklifler'); 

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // ✅ DÜZELTİLDİ: Jobs ve Offers'ı birlikte çeken fonksiyon
  const fetchJobsWithOffers = async (jobDocs) => {
    const jobsWithOffers = await Promise.all(
      jobDocs.map(async (jobDoc) => {
        const jobData = { ...jobDoc.data(), id: jobDoc.id };
        
        // Her job için offers subcollection'ı çek
        try {
          const offersRef = firestore().collection('jobs').doc(jobDoc.id).collection('offers');
          const offersSnap = await offersRef.get();
          const offers = offersSnap.docs.map(offerDoc => ({
            id: offerDoc.id,
            ...offerDoc.data()
          }));
          jobData.offers = offers;
        } catch (e) {
          jobData.offers = [];
        }
        
        return jobData;
      })
    );
    return jobsWithOffers;
  };

  useEffect(() => {
    if (!user) return;

    const q = firestore().collection('jobs').orderBy('createdAt', 'desc');

    const unsubscribe = q.onSnapshot(async (snapshot) => {
      try {
        // Tüm jobs'ları offers ile birlikte çek
        const allJobsWithOffers = await fetchJobsWithOffers(snapshot.docs);
        
        const filtered = allJobsWithOffers.filter(job => {
          const myId = String(user.uid);
          const isOwner = job.userId === myId; 
          // ✅ DÜZELTİLDİ: offers artık doğru şekilde kontrol ediliyor
          const didIBid = job.offers?.some(o => String(o.proId) === myId); 
          const amIChosen = String(job.acceptedProId) === myId; 
          
          return isOwner || didIBid || amIChosen;
        });

        setMyJobs(filtered);
      } catch (error) {
        console.error("Jobs fetch error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const getVisibleJobs = () => {
    return myJobs.filter(job => {
      const s = job.status;
      const myOffer = job.offers?.find(o => String(o.proId) === String(user.uid));
      const isAccepted = myOffer?.status === 'accepted' || String(job.acceptedProId) === String(user.uid);
      const isOwner = job.userId === String(user.uid);

      if (activeTab === 'Teklifler') {
          if (isOwner && (s === 'Aktif' || s === 'Onay Bekliyor')) return true;
          if (!isOwner && (s === 'Aktif' || s === 'Onay Bekliyor') && !isAccepted) return true;
          return false;
      } 
      if (activeTab === 'Aktif') {
          if (s === 'Devam Ediyor' || s === 'Teslim Bekliyor') return true;
          if (s === 'Onay Bekliyor' && (isOwner || isAccepted)) return true;
          return false;
      }
      if (activeTab === 'Geçmiş') {
          return s === 'Tamamlandı' || s === 'İptal' || s === 'Değerlendirildi';
      }
      return false;
    });
  };

  // ✅ DÜZELTİLDİ: İşi başlatma fonksiyonu - Usta için
  const handleStartJob = async (jobId) => {
      if (!jobId) {
          alertError("Hata", "İş ID'si bulunamadı. Lütfen sayfayı yenileyin.");
          return;
      }

      alertInfo("İşi Başlat", "Müşteri seni seçti. İşi onaylayıp başlatıyor musun?", [
          { text: "İptal", style: "cancel" },
          { text: "BAŞLAT", onPress: async () => {
              try {
                const jobRef = firestore().collection('jobs').doc(jobId);
                const jobSnap = await jobRef.get();

                if (!jobSnap.exists) {
                    alertError("Hata", "İş bulunamadı.");
                    return;
                }

                const jobData = jobSnap.data();

                await jobRef.update({
                    status: 'Devam Ediyor',
                    proStartedAt: firestore.FieldValue.serverTimestamp()
                });

                // Müşteriye bildirim gönder
                if (jobData.userId) {
                    await sendNotification({
                        text: "Usta işi başlattı! Çalışmalar başladı. 🔨",
                        targetUserId: jobData.userId,
                        targetRole: 'customer',
                        data: { type: 'JOB', jobId: jobId }
                    });

                    // Push notification
                    const customerDoc = await firestore().collection('users').doc(jobData.userId).get();
                    if (customerDoc.exists && customerDoc.data().pushToken) {
                        await sendPushNotification(
                            customerDoc.data().pushToken,
                            "İş Başladı! 🔨",
                            "Usta işinize başladı.",
                            { type: 'JOB', jobId: jobId }
                        );
                    }
                }

                alertSuccess("Başarılı", "İş başlatıldı! Kolay gelsin. 💪");
              } catch(e) { 
                  console.error("Başlatma Hatası:", e);
                  alertError("Hata", "İş başlatılamadı: " + e.message); 
              }
          }}
      ]);
  };

  // ✅ DÜZELTİLDİ: İşi bitirme fonksiyonu - Usta için
  const handleFinishJob = async (jobId) => {
      if (!jobId) return alertError("Hata", "İş ID'si bulunamadı.");

      const currentJob = myJobs.find(j => j.id === jobId);

      alertInfo("İşi Teslim Et", "İşi bitirdin mi? Müşteriye bildirim gidecek.", [
          { text: "Hayır", style: "cancel" },
          { text: "Evet, Bitirdim", onPress: async () => {
              try {
                const jobRef = firestore().collection('jobs').doc(jobId);

                await jobRef.update({
                    status: 'Teslim Bekliyor',
                    proFinishedAt: firestore.FieldValue.serverTimestamp()
                });

                if (currentJob && currentJob.userId) {
                    await sendNotification({
                        targetUserId: currentJob.userId, 
                        targetRole: 'customer',          
                        text: "İş Tamamlandı! 🎁 Usta işi bitirdiğini bildirdi. Onaylamak için dokun.",
                        data: { type: 'JOB', jobId: jobId }
                    });

                    const customerRef = firestore().collection('users').doc(currentJob.userId);
                    const customerSnap = await customerRef.get();

                    if (customerSnap.exists) {
                        const token = customerSnap.data().pushToken;
                        if (token) {
                            await sendPushNotification(
                                token,
                                "İş Tamamlandı! 🎁",
                                "Usta işi bitirdi. Onaylamak için uygulamaya gir.",
                                { type: 'JOB', jobId: jobId }
                            );
                        }
                    }
                }

                alertSuccess("Başarılı", "İş teslim edildi ve müşteriye bildirildi.");
                
              } catch(e) { 
                  console.error("Hata:", e);
                  alertError("Hata", "Bir sorun oluştu: " + e.message); 
              }
          }}
      ]);
  };

  // ✅ DÜZELTİLDİ: Teklif kabul etme - Müşteri için
  const handleAcceptOffer = (jobId, offer) => {
    if (!jobId || !offer) return;
    alertInfo(
      "Teklifi Kabul Et",
      `${offer.ustaName} ile ${offer.price}₺ fiyata anlaşmak istiyor musun?`,
      [
        { text: "Hayır" },
        { text: "Evet, Kabul Et", onPress: async () => {
            const success = await acceptOffer(jobId, offer.id);
            if (success) {
                alertSuccess("Başarılı", "Teklif kabul edildi! Usta bilgilendirildi. Ustanın işi başlatmasını bekleyin.");
            }
        }}
      ]
    );
  };

  // ✅ DÜZELTİLDİ: İş onaylama - Müşteri için (usta işi bitirdikten sonra)
  const handleConfirmCompletion = (jobId) => {
    if (!jobId) {
        alertError("Hata", "İş ID'si bulunamadı.");
        return;
    }

    alertInfo("İşi Onayla", "İşin tamamlandığını onaylıyor musun? Onayladıktan sonra ustayı puanlayabilirsin.", [
        { text: "Hayır", style: "cancel" },
        { text: "Evet, Onayla", onPress: async () => {
            try {
                const jobRef = firestore().collection('jobs').doc(jobId);
                const jobSnap = await jobRef.get();

                if (!jobSnap.exists) {
                    alertError("Hata", "İş bulunamadı.");
                    return;
                }

                const jobData = jobSnap.data();

                await jobRef.update({
                    status: 'Tamamlandı',
                    completedAt: firestore.FieldValue.serverTimestamp()
                });

                // Ustaya bildirim gönder
                if (jobData.acceptedProId) {
                    await sendNotification({
                        text: "Müşteri işi onayladı! Tebrikler! 🎉",
                        targetUserId: jobData.acceptedProId,
                        targetRole: 'pro',
                        data: { type: 'JOB', jobId: jobId }
                    });

                    const proDoc = await firestore().collection('users').doc(jobData.acceptedProId).get();
                    if (proDoc.exists && proDoc.data().pushToken) {
                        await sendPushNotification(
                            proDoc.data().pushToken,
                            "İş Onaylandı! 🎉",
                            "Müşteri işi onayladı. Tebrikler!",
                            { type: 'JOB', jobId: jobId }
                        );
                    }
                }
                
                // Puanlama modalını aç
                openReviewModal(jobId);
                
            } catch (e) {
                console.error("Onaylama Hatası:", e);
                alertError("Hata", "Onaylama işlemi başarısız.");
            }
        }}
    ]);
  };

  const openReviewModal = (jobId) => { 
      if (!jobId) return;
      setSelectedJobId(jobId); 
      setRating(0); 
      setComment(''); 
      setReviewModalVisible(true); 
  };

  const submitReview = async () => {
      if (rating === 0) return alertWarning("Uyarı", "Lütfen puan verin.");
      if (!selectedJobId) return alertError("Hata", "İş seçimi kayboldu.");

      try {
          const jobRef = firestore().collection('jobs').doc(selectedJobId);
          const jobSnap = await jobRef.get();
          if (!jobSnap.exists) {
              alertError("Hata", "İş bulunamadı.");
              return;
          }

          const jobData = jobSnap.data();
          const proId = jobData.acceptedProId; 

          await jobRef.update({
             status: 'Değerlendirildi',
             review: {
                 rating: rating,
                 comment: comment,
                 createdAt: new Date(),
                 customerName: userProfile?.name || userProfile?.fullname || "Müşteri"
             }
          });

          if (proId) {
              const proRef = firestore().collection('users').doc(proId);
              const proSnap = await proRef.get();
              if (proSnap.exists) {
                  const proData = proSnap.data();
                  const currentRating = proData.rating || 0;
                  const currentCount = proData.reviewCount || 0;
                  const newCount = currentCount + 1;
                  const newRating = ((currentRating * currentCount) + rating) / newCount;

                  await proRef.update({
                      rating: newRating,
                      reviewCount: newCount,
                      reviews: firestore.FieldValue.arrayUnion({
                          jobId: selectedJobId,
                          customerName: userProfile?.name || userProfile?.fullname || "Müşteri",
                          rating: rating,
                          comment: comment,
                          date: new Date().toLocaleDateString('tr-TR')
                      })
                  });

                  // Ustaya bildirim
                  await sendNotification({
                      text: `Müşteri sana ${rating} yıldız verdi! ⭐`,
                      targetUserId: proId,
                      targetRole: 'pro',
                      data: { type: 'JOB', jobId: selectedJobId }
                  });
              }
          }
          alertSuccess("Başarılı", "Değerlendirmeniz kaydedildi. Teşekkürler!");
          setReviewModalVisible(false);
      } catch (error) {
          console.error("Yorum Hatası:", error);
          alertError("Hata", "Yorum kaydedilemedi.");
      }
  };

  const fetchUserName = async (userId) => {
    try {
        const userDoc = await firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            return data.fullname || data.name || 'Kullanıcı';
        }
        return 'Kullanıcı';
    } catch (e) {
        console.log("İsim çekilemedi:", e);
        return 'Kullanıcı';
    }
  };

  const renderItem = ({ item }) => {
    const isOwner = item.userId === user.uid; 
    const myOffer = !isOwner ? item.offers?.find(o => String(o.proId) === String(user.uid)) : null;
    const acceptedOffer = item.offers?.find(o => o.id === item.acceptedOfferId);
    const isJobMine = myOffer && item.acceptedOfferId === myOffer.id;

    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('JobDetail', { job: item })}
        style={[styles.card, {backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1}]}
      >
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
            <View style={{flex:1}}>
                <Text style={[styles.title, {color: theme.text}]}>{item.serviceName || item.title || item.category}</Text>
                <Text style={{fontSize:12, color: theme.subText}}>📍 {item.city || 'Belirtilmedi'} / {item.district || ''}</Text>
            </View>
            <StatusBadge status={item.status} />
        </View>

        <View style={{height:1, backgroundColor:theme.border, marginVertical:8}} />

        {/* MÜŞTERİ GÖRÜNÜMÜ */}
        {isOwner && (
            <View>
                {item.status === 'Aktif' && (
                    <View>
                         <Text style={{fontSize:12, color:theme.subText, marginBottom:5}}>Gelen Teklifler ({item.offers?.length || 0}):</Text>
                         {item.offers && item.offers.length > 0 ? (
                             item.offers.map(offer => (
                                 <View key={offer.id} style={styles.offerRow}>
                                     <TouchableOpacity style={{flex:1}} onPress={() => navigation.navigate('ProDetail', { proId: offer.proId })}>
                                         <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                                             <Ionicons name="person-circle" size={20} color={COLORS.primary} />
                                             <Text style={{fontWeight:'bold', fontSize:14, color: theme.text}}>{offer.ustaName}</Text>
                                         </View>
                                         <Text style={{fontWeight:'bold', color: COLORS.primary, marginLeft: 24}}>{offer.price} ₺</Text>
                                     </TouchableOpacity>
                                     <View style={{flexDirection:'row', gap:5}}>
                                         <TouchableOpacity 
                                            style={[styles.miniBtn, {backgroundColor: '#e0f2fe'}]} 
                                            onPress={async () => {
                                                const ustaName = await fetchUserName(offer.proId);
                                                navigation.navigate('ChatScreen', { 
                                                    ustaName: ustaName, 
                                                    targetUserId: offer.proId, 
                                                    jobId: item.id,
                                                    currentUserRole: 'customer'
                                                });
                                            }}
                                         >
                                             <Ionicons name="chatbubble" size={16} color="#0284c7" />
                                         </TouchableOpacity>
                                         <TouchableOpacity style={[styles.miniBtn, {backgroundColor: COLORS.primary}]} onPress={() => handleAcceptOffer(item.id, offer)}>
                                             <Text style={{color:'white', fontSize:10, fontWeight:'bold'}}>Seç</Text>
                                         </TouchableOpacity>
                                     </View>
                                 </View>
                             ))
                         ) : (
                             <Text style={{fontSize:12, color:'#999', fontStyle:'italic'}}>Henüz teklif yok.</Text>
                         )}
                    </View>
                )}

                {/* MÜŞTERİ: Anlaşma yapıldıktan sonraki durumlar */}
                {acceptedOffer && ['Onay Bekliyor', 'Devam Ediyor', 'Teslim Bekliyor'].includes(item.status) && (
                    <View style={{backgroundColor:'#f0fdf4', padding:10, borderRadius:8}}>
                        <TouchableOpacity onPress={() => navigation.navigate('ProDetail', { proId: acceptedOffer.proId })} style={{flexDirection:'row', alignItems:'center', marginBottom:5}}>
                             <Text style={{color:'#166534', fontWeight:'bold', fontSize:13}}>Çalışılan Usta: {acceptedOffer.ustaName}</Text>
                             <Ionicons name="chevron-forward" size={14} color="#166534" />
                        </TouchableOpacity>
                        <Text style={{fontWeight:'bold', color:'#16a34a', marginBottom:5}}>Anlaşılan Fiyat: {acceptedOffer.price} ₺</Text>
                        
                        {item.status === 'Onay Bekliyor' && (
                            <View style={{backgroundColor:'#fef3c7', padding:8, borderRadius:6, marginTop:5}}>
                                <Text style={{fontSize:11, color:'#92400e', textAlign:'center'}}>⏳ Ustanın işi başlatması bekleniyor...</Text>
                            </View>
                        )}

                        {item.status === 'Devam Ediyor' && (
                            <View style={{backgroundColor:'#dbeafe', padding:8, borderRadius:6, marginTop:5}}>
                                <Text style={{fontSize:11, color:'#1e40af', textAlign:'center'}}>🔨 Usta işin üzerinde çalışıyor...</Text>
                            </View>
                        )}
                        
                        {/* TESLİM BEKLİYOR - Müşteri onayı */}
                        {item.status === 'Teslim Bekliyor' && (
                            <View>
                                <View style={{backgroundColor:'#fef3c7', padding:10, borderRadius:8, marginTop:10, borderWidth:1, borderColor:'#fbbf24'}}>
                                    <Text style={{color:'#92400e', fontWeight:'bold', textAlign:'center'}}>
                                        ⚠️ Usta işi teslim ettiğini bildirdi!
                                    </Text>
                                    <Text style={{color:'#92400e', fontSize:11, textAlign:'center', marginTop:2}}>
                                        İşi kontrol edip onaylayın.
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.mainBtn, {backgroundColor: '#16a34a', marginTop:10}]} 
                                    onPress={() => handleConfirmCompletion(item.id)}
                                >
                                    <Text style={styles.btnText}>✅ İşi Onayla ve Puanla</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        {item.status !== 'Teslim Bekliyor' && (
                            <TouchableOpacity 
                                style={{marginTop:8, flexDirection:'row', alignItems:'center'}} 
                                onPress={async () => {
                                    const ustaName = await fetchUserName(acceptedOffer.proId);
                                    navigation.navigate('ChatScreen', { 
                                        ustaName: ustaName, 
                                        targetUserId: acceptedOffer.proId, 
                                        jobId: item.id,
                                        currentUserRole: 'customer'
                                    });
                                }}
                            >
                                <Ionicons name="chatbubbles" size={16} color={COLORS.primary} />
                                <Text style={{color:COLORS.primary, marginLeft:5, fontWeight:'bold', fontSize:12}}>Mesaj Gönder</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {item.status === 'Tamamlandı' && (
                    <TouchableOpacity style={[styles.mainBtn, {backgroundColor:'#f59e0b', marginTop:5}]} onPress={() => openReviewModal(item.id)}>
                        <Text style={styles.btnText}>⭐ Puan Ver / Yorum Yap</Text>
                    </TouchableOpacity>
                )}
            </View>
        )}

        {/* USTA GÖRÜNÜMÜ */}
        {!isOwner && (
            <View>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:5}}>
                    <Text style={{color:theme.subText, fontSize:12}}>Senin Teklifin:</Text>
                    <Text style={{fontWeight:'bold', color:COLORS.primary}}>{myOffer?.price} ₺</Text>
                </View>

                {item.status === 'Aktif' && (
                    <Text style={{fontSize:12, color:'#d97706', fontStyle:'italic'}}>⏳ Müşterinin seçim yapması bekleniyor...</Text>
                )}

                {/* USTA: Teklif kabul edildi, işi başlat */}
                {item.status === 'Onay Bekliyor' && isJobMine && (
                    <View>
                        <View style={{padding:10, backgroundColor:'#dcfce7', borderRadius:8, marginBottom:10, borderWidth:1, borderColor:'#22c55e'}}>
                            <Text style={{color:'#166534', fontWeight:'bold', textAlign:'center', fontSize:13}}>🎉 TEBRİKLER! Teklifin kabul edildi!</Text>
                            <Text style={{color:'#166534', fontSize:11, textAlign:'center', marginTop:2}}>İşe başlamak için aşağıdaki butona tıkla.</Text>
                        </View>
                        <TouchableOpacity style={[styles.mainBtn, {backgroundColor: '#16a34a'}]} onPress={() => handleStartJob(item.id)}>
                            <Text style={styles.btnText}>🚀 İŞİ BAŞLAT</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* USTA: İş devam ediyor, bitir butonu */}
                {item.status === 'Devam Ediyor' && isJobMine && (
                    <View>
                        <View style={{padding:8, backgroundColor:'#dbeafe', borderRadius:6, marginBottom:10}}>
                            <Text style={{color:'#1e40af', fontSize:11, textAlign:'center'}}>🔨 İş devam ediyor. Bitirdiğinde aşağıdaki butona tıkla.</Text>
                        </View>
                        <TouchableOpacity style={[styles.mainBtn, {backgroundColor: '#3b82f6'}]} onPress={() => handleFinishJob(item.id)}>
                            <Text style={styles.btnText}>🎁 İşi Bitirdim / Teslim Et</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* USTA: Teslim bekliyor */}
                {item.status === 'Teslim Bekliyor' && isJobMine && (
                    <View style={{padding:10, backgroundColor:'#fef3c7', borderRadius:8}}>
                        <Text style={{color:'#92400e', fontSize:12, textAlign:'center'}}>⏳ Müşterinin işi onaylaması bekleniyor...</Text>
                    </View>
                )}
                
                {/* Müşteriyle mesajlaş */}
                <TouchableOpacity 
                    style={{marginTop:10, alignSelf:'flex-start', flexDirection:'row', alignItems:'center'}} 
                    onPress={async () => {
                        const customerName = await fetchUserName(item.userId);
                        navigation.navigate('ChatScreen', { 
                            ustaName: customerName, 
                            targetUserId: item.userId, 
                            jobId: item.id,
                            currentUserRole: 'pro'
                        });
                    }}
                >
                    <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
                    <Text style={{color:COLORS.primary, marginLeft:5, fontSize:12}}>Müşteriyle Görüş</Text>
                </TouchableOpacity>
            </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.statusBar} />
      
      <View style={{flexDirection:'row', padding:5, backgroundColor: theme.card, margin:10, borderRadius:12, elevation:2}}>
          {['Teklifler', 'Aktif', 'Geçmiş'].map((tab) => (
             <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabBtn, activeTab === tab && {backgroundColor: COLORS.primary, elevation:2}]}>
                <Text style={{fontWeight:'bold', fontSize: 13, color: activeTab === tab ? 'white' : theme.subText}}>{tab}</Text>
             </TouchableOpacity>
          ))}
      </View>

      {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop:50}} />
      ) : (
          <FlatList 
            data={getVisibleJobs()}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{padding:15, paddingBottom:100, flexGrow: 1}}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                     <View style={[styles.iconCircle, {backgroundColor: theme.input}]}>
                        <Ionicons name="clipboard-outline" size={60} color={theme.subText} />
                    </View>
                    <Text style={[styles.emptyTitle, {color: theme.text}]}>
                        {activeTab === 'Teklifler' ? 'Henüz İlan/Teklif Yok' : activeTab === 'Aktif' ? 'Aktif İşin Yok' : 'Geçmiş Kayıt Yok'}
                    </Text>
                    <Text style={[styles.emptySub, {color: theme.subText}]}>
                        {activeTab === 'Teklifler' 
                            ? (userRole === 'pro' 
                                ? 'İş Fırsatları sayfasından ilanlara teklif verebilirsin.' 
                                : 'Evindeki işleri halletmek için hemen ücretsiz bir ilan oluştur.')
                            : 'Aktif işlerin durumu burada görünür.'}
                    </Text>
                    {activeTab === 'Teklifler' && userRole !== 'pro' && (
                        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CustomerTabs', {screen: 'Ana Sayfa'})}>
                            <Text style={{color:'white', fontWeight:'bold', fontSize:16}}>+ Yeni İlan Oluştur</Text>
                        </TouchableOpacity>
                    )}
                </View>
            }
          />
      )}

      {/* PUANLAMA MODALI */}
      <Modal visible={reviewModalVisible} transparent animationType="fade" onRequestClose={() => setReviewModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {backgroundColor: theme.card}]}>
                <Text style={{fontSize:18, fontWeight:'bold', marginBottom:15, color:theme.text, textAlign:'center'}}>Ustayı Puanla ⭐</Text>
                <View style={{flexDirection:'row', gap:10, marginBottom:15, justifyContent:'center'}}>
                    {[1,2,3,4,5].map(s => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                            <Ionicons name={s <= rating ? "star" : "star-outline"} size={36} color="#f59e0b" />
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput 
                    style={[styles.input, {backgroundColor: theme.input, color:theme.text}]} 
                    placeholder="Yorumun (isteğe bağlı)..." 
                    placeholderTextColor={theme.subText} 
                    value={comment} 
                    onChangeText={setComment} 
                    multiline
                />
                <View style={{flexDirection:'row', gap:10, marginTop:15}}>
                    <TouchableOpacity style={[styles.mainBtn, {backgroundColor:theme.border, flex:1}]} onPress={() => setReviewModalVisible(false)}>
                        <Text style={{color:theme.text}}>Vazgeç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.mainBtn, {flex:1}]} onPress={submitReview}>
                        <Text style={styles.btnText}>Gönder</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom:4 },
  tabBtn: { flex:1, paddingVertical:10, alignItems:'center', borderRadius:8 },
  offerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:10, backgroundColor:'#f8fafc', borderRadius:8, marginBottom:8, borderWidth:1, borderColor:'#e2e8f0' },
  miniBtn: { paddingHorizontal:10, paddingVertical:6, borderRadius:6, alignItems:'center', justifyContent:'center' },
  mainBtn: { padding:12, borderRadius:8, alignItems:'center', justifyContent:'center', backgroundColor: COLORS.primary },
  btnText: { color:'white', fontWeight:'bold', fontSize:14 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center' },
  modalContent: { width:'85%', padding:20, borderRadius:16, elevation:5 },
  input: { width:'100%', padding:12, borderRadius:8, height:80, textAlignVertical:'top' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, padding: 20 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  emptySub: { textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 30 },
  createBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 20, shadowColor: COLORS.primary, shadowOpacity: 0.3, elevation: 5 }
});