import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useUI } from '../context/UIContext';

import firestore from '@react-native-firebase/firestore';

// ✅ DÜZELTİLDİ: 'var' yerine 'const' kullanıldı ve kod modernize edildi.
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export default function PhoneLoginScreen({ navigation }) {
  const { alertSuccess, alertError } = useUI();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState('customer');
  const [timeLeft, setTimeLeft] = useState(0); 

  // --- GERİ SAYIM MANTIĞI ---
  useEffect(() => {
    if (timeLeft === 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // 1. SMS Gönder
  const signInWithPhoneNumber = async () => {
    if (!phoneNumber) {
       alertError("Hata", "Lütfen numara giriniz.");
       return;
    }

    setLoading(true);

    // 15 Saniye Timeout (Sonsuz dönmeyi engellemek için)
    const timeout = setTimeout(() => {
        if(loading) {
            setLoading(false);
            alertError("Zaman Aşımı", "Sunucudan cevap alınamadı. İnternetinizi kontrol edin.");
        }
    }, 15000);

    try {
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+90${phoneNumber}`;

      const confirmation = await auth().signInWithPhoneNumber(formattedNumber);

      clearTimeout(timeout); // İşlem başarılı, zamanlayıcıyı iptal et

      setConfirm(confirmation);
      setTimeLeft(60); // 60 Saniyelik engel başlat
      alertSuccess("Başarılı", "Kod gönderildi!");

    } catch (error) {
      clearTimeout(timeout);
      console.log("SMS Hatası:", error);
      let msg = "SMS gönderilemedi.";
      if (error.code === 'auth/invalid-phone-number') msg = "Geçersiz telefon numarası.";
      if (error.code === 'auth/too-many-requests') msg = "Çok fazla deneme yaptınız.";

      alertError("Hata", msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Kodu Doğrula (Tek Oturum Mantığı Dahil)
  const confirmCode = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const userCredential = await confirm.confirm(code);
      const user = userCredential.user;

      if (user) {
          const userRef = firestore().collection('users').doc(user.uid);
          const userDoc = await userRef.get();

          // --- TEK OTURUM: GÜVENLİ SESSION ID OLUŞTUR ---
          const newSessionId = generateUUID();

          await AsyncStorage.setItem('my_session_id', newSessionId);
          // -------------------------------------------

          let targetRoute = 'CustomerTabs';

          if (userDoc.exists) {
              // --- ESKİ KULLANICI İSE ---
              const userData = userDoc.data();
              if (userData.role === 'pro') targetRoute = 'ProTabs';
              else targetRoute = 'CustomerTabs';

              // Veritabanındaki Session ID'yi güncelle
              await userRef.update({ validSessionId: newSessionId });

          } else {
              // --- YENİ KULLANICI İSE ---
              await userRef.set({
                  uid: user.uid,
                  phone: user.phoneNumber,
                  role: selectedRole,
                  name: selectedRole === 'pro' ? 'Yeni Usta' : 'Yeni Müşteri',
                  createdAt: firestore.FieldValue.serverTimestamp(),
                  bio: '',
                  isVip: false,
                  validSessionId: newSessionId // <-- İlk kayıtta ekle
              });

              if (selectedRole === 'pro') targetRoute = 'ProTabs';
              else targetRoute = 'CustomerTabs';
          }

          navigation.reset({
              index: 0,
              routes: [{ name: targetRoute }],
          });
      }

    } catch (error) {
      alertError('Hata', 'Girdiğiniz kod hatalı veya süresi dolmuş.');
    } finally {
      setLoading(false);
    }
  };

  // "Numarayı Değiştir" fonksiyonu
  const handleChangeNumber = () => {
    setConfirm(null); 
    setCode(''); 
    // DİKKAT: setTimeLeft(0) KULLANMIYORUZ!
    // Böylece geri dönse bile süre işlemeye devam eder.
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1, padding: 20}}>
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginBottom: 20}}>
            <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>

        <View style={{marginTop: 20, marginBottom: 30}}>
            <Text style={styles.title}>{confirm ? 'Kodu Girin' : 'Telefon ile Giriş'}</Text>
            <Text style={styles.subText}>
                {confirm 
                    ? `SMS ile gelen 6 haneli kodu girin.` 
                    : 'Devam etmek için lütfen rolünüzü seçin ve numaranızı girin.'}
            </Text>
        </View>

        {!confirm ? (
            <>
                {/* ROL SEÇİMİ */}
                <View style={{flexDirection: 'row', marginBottom: 20, gap: 10}}>
                    <TouchableOpacity 
                        onPress={() => setSelectedRole('customer')}
                        style={[styles.roleBtn, selectedRole === 'customer' && styles.roleBtnActive]}
                    >
                        <Ionicons name="home" size={20} color={selectedRole === 'customer' ? 'white' : '#555'} />
                        <Text style={[styles.roleText, selectedRole === 'customer' && {color:'white'}]}>Müşteriyim</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => setSelectedRole('pro')}
                        style={[styles.roleBtn, selectedRole === 'pro' && styles.roleBtnActive]}
                    >
                        <Ionicons name="briefcase" size={20} color={selectedRole === 'pro' ? 'white' : '#555'} />
                        <Text style={[styles.roleText, selectedRole === 'pro' && {color:'white'}]}>Ustayım</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={{fontSize:16, color:'#666', marginRight:10}}>+90</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="555 123 45 67"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        maxLength={10} 
                    />
                </View>

                {/* --- GÖNDER BUTONU --- */}
                {/* timeLeft > 0 ise buton grileşir ve tıklanmaz */}
                <TouchableOpacity 
                    style={[styles.button, (loading || timeLeft > 0) && { backgroundColor: '#9CA3AF' }]} 
                    onPress={signInWithPhoneNumber} 
                    disabled={loading || timeLeft > 0}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                        {loading && <ActivityIndicator color="white" />}
                        <Text style={styles.buttonText}>
                            {loading ? "Gönderiliyor..." : "Kodu Gönder"}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* --- GERİ SAYIM UYARISI (BUTON ALTINDA) --- */}
                {timeLeft > 0 && (
                    <View style={{marginTop: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        <Ionicons name="time-outline" size={18} color="#ef4444" />
                        <Text style={{color: '#ef4444', marginLeft: 5, fontWeight: '500'}}>
                            Yeni kod için lütfen {timeLeft} saniye bekleyiniz.
                        </Text>
                    </View>
                )}

            </>
        ) : (
            <>
                <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={20} color="#666" style={{marginRight: 10}} />
                    <TextInput
                        style={styles.input}
                        placeholder="123456"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        value={code}
                        onChangeText={setCode}
                        maxLength={6}
                    />
                </View>
                <TouchableOpacity style={styles.button} onPress={confirmCode} disabled={loading}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                        {loading && <ActivityIndicator color="white" />}
                        <Text style={styles.buttonText}>{loading ? "Giriş Yapılıyor..." : "Giriş Yap"}</Text>
                    </View>
                </TouchableOpacity>
                
                {/* Numara Değiştir Butonu */}
                <TouchableOpacity onPress={handleChangeNumber} style={{marginTop:20, alignItems:'center'}}>
                    <Text style={{color: COLORS.primary}}>Numarayı Değiştir</Text>
                </TouchableOpacity>
            </>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subText: { fontSize: 16, color: '#6B7280', marginTop: 10 },
  inputContainer: { flexDirection:'row', alignItems:'center', backgroundColor:'#F3F4F6', borderRadius:12, paddingHorizontal:15, height:55, marginBottom: 20, borderWidth:1, borderColor:'#E5E7EB' },
  input: { flex:1, fontSize:16, color:'#1F2937' },
  button: { backgroundColor: COLORS.primary, height: 55, borderRadius: 12, justifyContent:'center', alignItems:'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowOffset: {width:0, height:5}, elevation:5 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  roleBtn: { flex: 1, flexDirection:'row', alignItems:'center', justifyContent:'center', padding: 15, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth:1, borderColor: '#E5E7EB' },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleText: { marginLeft: 8, fontWeight: 'bold', color: '#374151' },
});