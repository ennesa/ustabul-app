import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import LottieView from 'lottie-react-native';
// ✅ DEBOUNCE IMPORT EDİLDİ
import { debounce } from 'lodash';
import { useCallback, useEffect, useState } from 'react'; // ✅ useCallback EKLENDİ
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
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
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING, formatPrice } from '../config/pricing'; // ✅ Fiyat sabitleri eklendi
import { COLORS } from '../constants/colors';
import { TURKEY_DATA } from '../constants/data';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobContext';
import { useUI } from '../context/UIContext';
import { compressImage } from '../utils/imageHelper';

const SUCCESS_ANIMATION_URL = "https://lottie.host/8d7161b2-d735-4618-b9c4-577711045673/0M2X8M2s5z.json";

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01; 
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function CustomerScreen({ route, navigation }) {
  const { addJob } = useJobs();
  const { customerProfile, checkBalance, deductBalance, getBalance, isVipCustomer } = useAuth();
  const { theme, services, alertSuccess, alertError, alertWarning, alertInfo } = useUI(); 
  
  const safeCatalog = services || [];
  const safeTurkeyData = TURKEY_DATA || {};

  const initialCategoryName = route.params?.initialCategory;
  const initialCatObj = initialCategoryName ? safeCatalog.find(c => c.name === initialCategoryName) : null;

  // --- STATE'LER ---
  const [step, setStep] = useState(initialCatObj ? (initialCatObj.subServices.length > 0 ? 2 : 3) : 1);
  const [selectedCategory, setSelectedCategory] = useState(initialCatObj || null);
  const [selectedSubService, setSelectedSubService] = useState(null);
  const [answers, setAnswers] = useState({});
  
  // Adres Bilgileri
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [desc, setDesc] = useState('');
  
  // Konum ve Harita
  const [coords, setCoords] = useState(null); 
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapSearchTerm, setMapSearchTerm] = useState('');
  const [region, setRegion] = useState({
      latitude: 41.0082,
      longitude: 28.9784,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
  });

  // Diğer State'ler
  const [jobPhotos, setJobPhotos] = useState([]); 
  const [urgency, setUrgency] = useState('Normal'); 
  const [modalVisible, setModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);  // ✅ Ödeme onay modalı
  const [processingPayment, setProcessingPayment] = useState(false);  // ✅ Ödeme işleniyor durumu

  useEffect(() => {
    if (route.params?.initialCategory) {
      const catName = route.params.initialCategory;
      const catObj = safeCatalog.find(c => c.name === catName);
      if (catObj) {
        setSelectedCategory(catObj);
        setStep(catObj.subServices.length > 0 ? 2 : 3);
      }
    }
  }, [route.params?.initialCategory, safeCatalog]);

  // --- HARİTA FONKSİYONLARI ---
  const handleOpenMap = async () => {
    setLocationLoading(true);
    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            alertWarning("İzin Gerekli", "Haritayı kullanmak için konum izni vermelisiniz.");
            setLocationLoading(false);
            return;
        }

        if (coords) {
             setRegion({ ...region, latitude: coords.latitude, longitude: coords.longitude });
        } else {
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setRegion({ ...region, latitude: location.coords.latitude, longitude: location.coords.longitude });
        }
        setMapVisible(true); 
    } catch (error) {
        alertError("Hata", "Konum alınamadı, harita varsayılan konumda açılıyor.");
        setMapVisible(true); 
    } finally {
        setLocationLoading(false);
    }
  };

  const handleMapSearch = async () => {
      if (!mapSearchTerm.trim()) return;
      Keyboard.dismiss();
      try {
          const geocodedLocation = await Location.geocodeAsync(mapSearchTerm);
          if (geocodedLocation.length > 0) {
              const { latitude, longitude } = geocodedLocation[0];
              setRegion({ latitude, longitude, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA });
          } else {
              alertInfo("Bulunamadı", "Adres bulunamadı.");
          }
      } catch (error) { alertError("Hata", "Arama yapılamadı."); }
  };

  // ✅ OPTİMİZASYON: Debounce ve useCallback ile render sayısı azaltıldı
  const onRegionChangeComplete = useCallback(
      debounce((newRegion) => {
          setRegion(newRegion);
      }, 300), 
      []
  );

  // ✅ DÜZELTİLEN FONKSİYON: confirmLocation
  const confirmLocation = async () => {
      setLocationLoading(true); 
      try {
          const places = await Location.reverseGeocodeAsync({ 
            latitude: region.latitude, 
            longitude: region.longitude 
          });

          if (places && places.length > 0) {
              const addr = places[0];
              console.log("Haritadan Gelen Adres:", addr);

              // 1. ŞEHİR EŞLEŞTİRME
              // Türkiye'de: region = il, subregion = ilçe, district = mahalle
              // city genelde null geliyor, region'ı kullanmalıyız
              let detectedCity = addr.region || addr.city || addr.subregion;
              let detectedDistrict = addr.subregion || addr.district;
              let detectedNeighborhood = addr.district || addr.name;
              
              let matchedCity = null;

              if (detectedCity) {
                const cityKeys = Object.keys(safeTurkeyData);
                matchedCity = cityKeys.find(key => 
                    key.toLocaleUpperCase('tr-TR') === detectedCity.toLocaleUpperCase('tr-TR') ||
                    key.toUpperCase() === detectedCity.toUpperCase() 
                );
              }

              // ✅ GÜVENLİ KONTROL BLOĞU
              if (matchedCity) {
                  setCity(matchedCity);
                  
                  // 2. İLÇE EŞLEŞTİRME (subregion kullan)
                  if (detectedDistrict) {
                      const districtList = safeTurkeyData[matchedCity] || [];
                      
                      const matchedDistrict = districtList.find(d => 
                          d.toLocaleUpperCase('tr-TR') === detectedDistrict.toLocaleUpperCase('tr-TR')
                      );

                      if (matchedDistrict) {
                          setDistrict(matchedDistrict);
                      } else {
                          setDistrict(''); // İlçe bulunamadıysa temizle
                      }
                  } else {
                      setDistrict('');
                  }
                  
                  // 3. MAHALLE (district veya name)
                  if (detectedNeighborhood && detectedNeighborhood !== detectedDistrict) {
                      setNeighborhood(detectedNeighborhood);
                  }
                  
              } else {
                  // ❌ Şehir Eşleşmezse Güvenli Çıkış
                  alertInfo(
                    "Şehir Eşleşmedi",
                    "Konum algılandı ancak şehir listemizle tam eşleşmedi. Lütfen şehri listeden seçiniz."
                  );
                  setCity('');
                  setDistrict('');
              }

              // 4. SOKAK BİLGİSİ
              if(addr.street) setStreet(addr.street);
              
              setCoords({ latitude: region.latitude, longitude: region.longitude });
              setMapVisible(false);
          }
      } catch (e) { 
          console.log("Konum Hatası:", e);
          alertError("Hata", "Adres çözümlenirken bir sorun oluştu. Lütfen elle giriniz.");
      } finally {
          setLocationLoading(false); 
      }
  };

  // --- RESİM VE KATEGORİ ---
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category.subServices && category.subServices.length > 0) { setStep(2); } 
    else { setSelectedSubService({ name: category.name, questions: [] }); setStep(3); }
  };

  const handleSubServiceSelect = (sub) => { setSelectedSubService(sub); setStep(3); };
  const handleAnswerChange = (id, text) => { setAnswers(prev => ({ ...prev, [id]: text })); };

  const pickImage = async () => {
    if (jobPhotos.length >= 3) { alertWarning("Sınır", "En fazla 3 fotoğraf."); return; }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.5 });
    if (!result.canceled) {
        const compressedUri = await compressImage(result.assets[0].uri, alertWarning);
        setJobPhotos([...jobPhotos, compressedUri]);
    }
  };
  const removePhoto = (index) => { setJobPhotos(jobPhotos.filter((_, i) => i !== index)); };

  // --- İLAN YAYINLAMA ---
  const processJobPosting = async () => {
    const fullAddress = `${city}, ${district}, ${neighborhood}, ${street}, No: ${apartmentNo}`;
    let detailsText = "";
    if (selectedSubService.questions) {
        selectedSubService.questions.forEach(q => { detailsText += `• ${q.label}: ${answers[q.id] || '-'}\n`; });
    }

    const newJob = {
      serviceId: selectedCategory.id,
      serviceName: selectedSubService.name,
      category: selectedCategory.name,
      title: selectedSubService.name,
      city: city,
      district: district,
      neighborhood: neighborhood,
      address: fullAddress,
      description: `${detailsText}\n📍 Adres: ${fullAddress}\n📝 Ek Not: ${desc}`,
      jobPhotos, 
      isVip: urgency === 'Acil',
      location: null, 
      date: new Date().toLocaleDateString('tr-TR'), 
      offers: [], 
      status: 'Aktif'
    };

    addJob(newJob);
    setShowSuccessModal(true);
    // Formu Sıfırla
    setStep(1); setSelectedCategory(null); setSelectedSubService(null);
    setAnswers({}); setDesc(''); setJobPhotos([]); setCity(''); setDistrict(''); 
    setNeighborhood(''); setStreet(''); setApartmentNo(''); setUrgency('Normal');
    setCoords(null); setMapSearchTerm('');

    setTimeout(() => { setShowSuccessModal(false); navigation.navigate('CustomerTabs', { screen: 'Ana Sayfa' }); }, 2500);
  };

  // ✅ ÖDEME İŞLEMİ (Çift tıklama korumalı)
  const handlePaymentAndPost = async () => {
    // Zaten işlem yapılıyorsa çık
    if (processingPayment) {
      console.log("İşlem zaten devam ediyor, çift tıklama engellendi");
      return;
    }
    
    setProcessingPayment(true);
    setPaymentModalVisible(false); // Modalı hemen kapat ki tekrar tıklanamasın
    
    try {
      // Bakiyeden ücreti düş
      const result = await deductBalance(PRICING.POSTING_FEE, `İlan ücreti - ${selectedSubService?.name || 'İlan'}`);
      
      if (result.success) {
        await processJobPosting();
      } else {
        alertError("Hata", result.error || "Ödeme işlemi başarısız oldu.");
      }
    } catch (error) {
      alertError("Hata", "Bir sorun oluştu: " + error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  // ✅ YENİ handlePostJob - Ücretli sistem
  const handlePostJob = () => {
    if (!city || !district) { 
      alertWarning("Eksik", "Lütfen şehir ve ilçe seçin."); 
      return; 
    }
    
    // VIP Kontrolü (Acil ilan için)
    if (urgency === 'Acil' && !isVipCustomer()) {
        alertInfo("VIP Özellik", "Acil ilan vermek için VIP üye olmalısınız.");
        return;
    }

    // ✅ VIP müşteriler ücretsiz ilan açar
    if (isVipCustomer()) {
      alertSuccess(
        "VIP İlan",
        "VIP üye olarak ücretsiz ilan açabilirsiniz!",
        [
          { text: "Vazgeç" },
          { text: "İlanı Yayınla", onPress: () => processJobPosting() }
        ]
      );
      return;
    }

    // ✅ Normal müşteriler için bakiye kontrolü
    const currentBalance = getBalance();
    const requiredAmount = PRICING.POSTING_FEE;

    if (currentBalance < requiredAmount) {
      // Bakiye yetersiz - Bakiye yükleme ekranına yönlendir
      alertWarning(
        "Yetersiz Bakiye",
        `İlan yayınlamak için ${formatPrice(requiredAmount)} gerekli.\n\nMevcut bakiyeniz: ${formatPrice(currentBalance)}`,
        [
          { text: "Vazgeç" },
          {
            text: "Bakiye Yükle",
            onPress: () => navigation.navigate('CustomerWallet')
          }
        ]
      );
      return;
    }

    // ✅ Bakiye yeterli - Ödeme onay modalını göster
    setPaymentModalVisible(true);
  };

  const handleBack = () => {
    // Ana sayfadan mı geldik kontrolü (initialCategory parametresi var mı?)
    const cameFromHome = !!route.params?.initialCategory;

    if (step === 3) {
        setStep(2);
    } 
    else if (step === 2) {
        // Eğer Ana Sayfadan seçip geldiysek, Step 1'i (Kategori Listesi) hiç görmemeliyiz.
        // Direkt geri (Ana Sayfa) git.
        if (cameFromHome) {
            navigation.goBack();
        } else {
            // Ana sayfadan gelmedik, manuel geziyoruz, o zaman Step 1'e dönebilir.
            setStep(1);
        }
    } 
    else {
        navigation.goBack();
    }
  };

  const getFilteredData = () => {
    let data = [];
    if (selectionType === 'CITY') data = Object.keys(safeTurkeyData);
    else if (selectionType === 'DISTRICT') data = safeTurkeyData[city] || [];
    if (searchTerm) return data.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    return data;
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      {/* HEADER */}
      <View style={[styles.header, {backgroundColor: theme.card}]}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>
            {step === 1 ? 'Hizmet Seç' : step === 2 ? 'Detay Seç' : 'İlan Oluştur'}
        </Text>
        <View style={{width:24}} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
        <ScrollView contentContainerStyle={{flexGrow: 1, paddingBottom: 150}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* ADIM 1: KATEGORİ */}
            {step === 1 && (
                <View style={{padding: 20, flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between'}}>
                    {safeCatalog.map(item => (
                        <TouchableOpacity key={item.id} style={[styles.catItem, {backgroundColor: theme.card, borderColor: item.color}]} onPress={() => handleCategorySelect(item)}>
                            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                                <Ionicons name={item.icon} size={28} color={item.color} />
                            </View>
                            <Text style={[styles.catText, {color: theme.text}]}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* ADIM 2: ALT HİZMET */}
            {step === 2 && selectedCategory && (
                <View style={{padding: 20}}>
                    <Text style={[styles.subTitle, {color: theme.text}]}>Hangi hizmet lazım?</Text>
                    {selectedCategory.subServices?.map((sub, index) => (
                        <TouchableOpacity key={index} style={[styles.subServiceItem, {backgroundColor: theme.card}]} onPress={() => handleSubServiceSelect(sub)}>
                            <Text style={[styles.subServiceText, {color: theme.text}]}>{sub.name}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* ADIM 3: FORM */}
            {step === 3 && selectedSubService && (
                <View style={{padding: 20}}>
                    {/* Soru Cevaplar */}
                    <View style={[styles.card, {backgroundColor: theme.card}]}>
                        <Text style={[styles.cardTitle, {color: theme.text}]}>İş Detayları</Text>
                        {selectedSubService.questions?.map((q) => (
                            <View key={q.id} style={{marginBottom: 15}}>
                                <Text style={[styles.label, {color: theme.subText}]}>{q.label}</Text>
                                <TextInput 
                                    style={[styles.input, {backgroundColor: theme.input, color: theme.text}]} 
                                    placeholder={q.placeholder}
                                    placeholderTextColor={theme.subText}
                                    value={answers[q.id] || ''}
                                    onChangeText={(text) => handleAnswerChange(q.id, text)}
                                />
                            </View>
                        ))}
                    </View>

                    {/* ACİLİYET */}
                    <View style={[styles.card, {backgroundColor: theme.card}]}>
                        <Text style={[styles.cardTitle, {color: theme.text}]}>Aciliyet Durumu</Text>
                        <View style={{flexDirection:'row', gap:10}}>
                            <TouchableOpacity 
                                style={[styles.urgencyBtn, urgency === 'Normal' ? {backgroundColor: COLORS.primary} : {backgroundColor: theme.input}]}
                                onPress={() => setUrgency('Normal')}
                            >
                                <Text style={{color: urgency === 'Normal' ? 'white' : theme.text, fontWeight:'bold'}}>Normal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.urgencyBtn, urgency === 'Acil' ? {backgroundColor: '#ef4444'} : {backgroundColor: theme.input}]}
                                onPress={() => setUrgency('Acil')}
                            >
                                <Text style={{color: urgency === 'Acil' ? 'white' : theme.text, fontWeight:'bold'}}>ACİL ⚡</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* KONUM VE ADRES */}
                    <View style={[styles.card, {backgroundColor: theme.card}]}>
                        <Text style={[styles.cardTitle, {color: theme.text}]}>Konum ve Adres</Text>
                        
                        {/* HARİTA BUTONU */}
                        <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap} disabled={locationLoading}>
                            {locationLoading ? <ActivityIndicator color="white" /> : <Ionicons name="map" size={24} color="white" />}
                            <Text style={styles.mapButtonText}>{coords ? 'KONUM SEÇİLDİ (DEĞİŞTİR)' : 'HARİTADAN KONUM SEÇ'}</Text>
                        </TouchableOpacity>

                        <View style={{flexDirection:'row', gap:10, marginBottom:10}}>
                            <TouchableOpacity style={[styles.selectBox, {backgroundColor: theme.input}]} onPress={() => { setSelectionType('CITY'); setSearchTerm(''); setModalVisible(true); }}>
                                <Text style={{color: city ? theme.text : theme.subText}}>{city || 'İl Seç'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.selectBox, {backgroundColor: theme.input}]} onPress={() => { if(city) {setSelectionType('DISTRICT'); setSearchTerm(''); setModalVisible(true);} else { alertWarning("Bilgi", "Önce il seçin."); } }}>
                                <Text style={{color: district ? theme.text : theme.subText}}>{district || 'İlçe Seç'}</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput style={[styles.input, {backgroundColor: theme.input, color: theme.text, marginBottom:10}]} placeholder="Mahalle" placeholderTextColor={theme.subText} value={neighborhood} onChangeText={setNeighborhood} />
                        <View style={{flexDirection:'row', gap:10}}>
                            <TextInput style={[styles.input, {flex:2, backgroundColor: theme.input, color: theme.text}]} placeholder="Cadde / Sokak" placeholderTextColor={theme.subText} value={street} onChangeText={setStreet} />
                            <TextInput style={[styles.input, {flex:1, backgroundColor: theme.input, color: theme.text}]} placeholder="No" placeholderTextColor={theme.subText} value={apartmentNo} onChangeText={setApartmentNo} />
                        </View>
                    </View>

                    {/* FOTOĞRAFLAR */}
                    <View style={[styles.card, {backgroundColor: theme.card}]}>
                         <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                            <Text style={[styles.cardTitle, {color: theme.text}]}>Fotoğraflar</Text>
                            {jobPhotos.length < 3 && <TouchableOpacity onPress={pickImage}><Text style={{color:COLORS.primary, fontWeight:'bold'}}>+ Ekle</Text></TouchableOpacity>}
                         </View>
                         <View style={{flexDirection:'row', gap:10, marginTop:10}}>
                            {jobPhotos.map((uri, index) => (
                                <View key={index}>
                                    <Image source={{ uri }} style={{width:70, height:70, borderRadius:8}} />
                                    <TouchableOpacity style={styles.deleteBadge} onPress={() => removePhoto(index)}><Ionicons name="close" size={10} color="white" /></TouchableOpacity>
                                </View>
                            ))}
                         </View>
                    </View>

                    {/* NOT */}
                    <TextInput style={[styles.input, {height:80, backgroundColor: theme.card, color: theme.text, textAlignVertical:'top'}]} placeholder="Eklemek istediğiniz notlar..." placeholderTextColor={theme.subText} multiline value={desc} onChangeText={setDesc} />

                    {/* YAYINLA BUTONU */}
                    <TouchableOpacity style={styles.publishButton} onPress={handlePostJob}>
                        <Text style={styles.publishButtonText}>İlanı Yayınla</Text>
                    </TouchableOpacity>

                </View>
            )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- HARİTA MODALI --- */}
      <Modal visible={mapVisible} animationType="slide" hardwareAccelerated={false}>
          <View style={{flex:1}}>
              <MapView style={{flex:1}} region={region} onRegionChangeComplete={onRegionChangeComplete} />
              <View style={styles.markerFixed}><Ionicons name="location" size={50} color={COLORS.primary} /></View>
              
              {/* ARAMA KUTUSU */}
              <View style={styles.mapSearchContainer}>
                  <View style={styles.mapSearchBox}>
                      <Ionicons name="search" size={20} color="#666" />
                      <TextInput 
                          style={{flex:1, marginLeft:10, color:'#333'}} 
                          placeholder="Adres ara..." 
                          placeholderTextColor="#999"
                          value={mapSearchTerm} onChangeText={setMapSearchTerm} onSubmitEditing={handleMapSearch} 
                      />
                  </View>
                  <TouchableOpacity style={styles.mapSearchBtn} onPress={handleMapSearch}><Text style={{color:'white', fontWeight:'bold'}}>BUL</Text></TouchableOpacity>
              </View>

              <View style={styles.mapFooter}>
                  <TouchableOpacity style={styles.confirmLocationBtn} onPress={confirmLocation}>
                      <Text style={{color:'white', fontWeight:'bold', fontSize:16}}>BU KONUMU SEÇ ✅</Text>
                  </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.closeMapBtn} onPress={() => setMapVisible(false)}><Ionicons name="close" size={30} color="black" /></TouchableOpacity>
          </View>
      </Modal>

      {/* ŞEHİR/İLÇE SEÇİM MODALI */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
         <View style={styles.modalContainer}>
            <View style={[styles.modalContent, {backgroundColor: theme.card}]}>
                <View style={[styles.searchBox, {backgroundColor: theme.input}]}>
                    <Ionicons name="search" size={20} color={theme.subText} />
                    <TextInput style={{flex:1, marginLeft:10, color: theme.text}} placeholder="Ara..." placeholderTextColor={theme.subText} value={searchTerm} onChangeText={setSearchTerm} />
                </View>
                <FlatList 
                    data={getFilteredData()}
                    keyExtractor={item => item}
                    renderItem={({item}) => (
                        <TouchableOpacity style={{padding:15, borderBottomWidth:1, borderColor: theme.border}} onPress={() => {
                            if(selectionType === 'CITY') { setCity(item); setDistrict(''); }
                            else { setDistrict(item); }
                            setModalVisible(false);
                        }}>
                            <Text style={{color: theme.text}}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
                <TouchableOpacity style={{padding:15, alignItems:'center'}} onPress={() => setModalVisible(false)}><Text style={{color:theme.subText}}>Kapat</Text></TouchableOpacity>
            </View>
         </View>
      </Modal>

      {/* ✅ ÖDEME ONAY MODALI */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.paymentModal}>
            {/* Başlık */}
            <View style={{alignItems:'center', marginBottom:20}}>
              <View style={{backgroundColor:'#e0f2fe', width:60, height:60, borderRadius:30, alignItems:'center', justifyContent:'center', marginBottom:10}}>
                <Ionicons name="receipt-outline" size={30} color={COLORS.primary} />
              </View>
              <Text style={{fontSize:20, fontWeight:'bold', color:'#1f2937'}}>İlan Ücreti</Text>
            </View>

            {/* Detaylar */}
            <View style={{backgroundColor:'#f8fafc', padding:15, borderRadius:12, marginBottom:20}}>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                <Text style={{color:'#6b7280'}}>Hizmet:</Text>
                <Text style={{fontWeight:'600', color:'#1f2937'}}>{selectedSubService?.name || 'İlan'}</Text>
              </View>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                <Text style={{color:'#6b7280'}}>Konum:</Text>
                <Text style={{fontWeight:'600', color:'#1f2937'}}>{district}, {city}</Text>
              </View>
              <View style={{height:1, backgroundColor:'#e5e7eb', marginVertical:10}} />
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <Text style={{color:'#6b7280'}}>İlan Ücreti:</Text>
                <Text style={{fontWeight:'bold', fontSize:18, color:COLORS.primary}}>{formatPrice(PRICING.POSTING_FEE)}</Text>
              </View>
            </View>

            {/* Bakiye Bilgisi */}
            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:20, paddingHorizontal:5}}>
              <Text style={{color:'#6b7280'}}>Mevcut Bakiyeniz:</Text>
              <Text style={{fontWeight:'bold', color: getBalance() >= PRICING.POSTING_FEE ? '#16a34a' : '#ef4444'}}>
                {formatPrice(getBalance())}
              </Text>
            </View>

            {/* Butonlar */}
            <View style={{flexDirection:'row', gap:10}}>
              <TouchableOpacity 
                style={{flex:1, padding:15, borderRadius:12, backgroundColor:'#f1f5f9', alignItems:'center'}}
                onPress={() => !processingPayment && setPaymentModalVisible(false)}
                disabled={processingPayment}
              >
                <Text style={{fontWeight:'bold', color:'#64748b'}}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{
                  flex:1, 
                  padding:15, 
                  borderRadius:12, 
                  backgroundColor: processingPayment ? '#9ca3af' : COLORS.primary, 
                  alignItems:'center',
                  opacity: processingPayment ? 0.7 : 1
                }}
                onPress={handlePaymentAndPost}
                disabled={processingPayment}
                activeOpacity={0.7}
              >
                {processingPayment ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{fontWeight:'bold', color:'white'}}>💳 Öde ve Yayınla</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Bilgi Notu */}
            <Text style={{fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:15}}>
              Ödeme bakiyenizden düşülecektir. İlan 30 gün boyunca aktif kalır.
            </Text>
          </View>
        </View>
      </Modal>

      {/* BAŞARI MODALI */}
      <Modal visible={showSuccessModal} transparent>
        <View style={styles.overlay}>
          <View style={styles.successBox}>
            <LottieView source={{ uri: SUCCESS_ANIMATION_URL }} autoPlay loop={false} style={{width:100, height:100}} />
            <Text style={{fontWeight:'bold', marginTop:10}}>Yayınlandı!</Text>
          </View>
        </View>
      </Modal>
    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  subTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  catItem: { width: '31%', borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 10, borderWidth:1 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  catText: { fontSize: 12, fontWeight: '600', textAlign:'center' },
  subServiceItem: { padding: 20, borderRadius: 12, flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 10, elevation: 1 },
  subServiceText: { fontSize: 16, fontWeight: '500' },
  
  card: { padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
  input: { padding: 12, borderRadius: 10, fontSize: 15 },
  
  urgencyBtn: { flex:1, padding:12, borderRadius:8, alignItems:'center' },
  
  mapButton: { flexDirection:'row', backgroundColor:COLORS.primary, padding:15, borderRadius:10, alignItems:'center', justifyContent:'center', marginBottom:15, elevation:3 },
  mapButtonText: { color:'white', fontWeight:'bold', marginLeft:10 },
  
  selectBox: { flex:1, padding:12, borderRadius:10, borderWidth:1, borderColor:'#ddd' },
  deleteBadge: { position:'absolute', top:-5, right:-5, backgroundColor:'red', width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center' },
  
  publishButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom:30, elevation:5 },
  publishButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // HARİTA STİLLERİ
  markerFixed: { position: 'absolute', top: '50%', left: '50%', marginLeft: -25, marginTop: -50 },
  mapSearchContainer: { position: 'absolute', top: 50, left: 20, right: 70, flexDirection: 'row', gap: 10, zIndex: 10 },
  mapSearchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 10, elevation: 5 },
  mapSearchBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  mapFooter: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  confirmLocationBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center', elevation:5 },
  closeMapBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 5 },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%', padding: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 10 },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'center', alignItems:'center' },
  successBox: { backgroundColor:'white', padding:30, borderRadius:20, alignItems:'center' },
  paymentModal: { backgroundColor:'white', padding:25, borderRadius:20, width:'85%', maxWidth:400 }
});