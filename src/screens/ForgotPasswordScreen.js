import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { resetPassword } = useAuth();
  const { alertWarning, alertError } = useUI();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false); // Gönderildi mi?

  const handleReset = async () => {
    if (!email) {
      alertWarning('Eksik Bilgi', 'Lütfen e-posta adresinizi yazın.');
      return;
    }

    setLoading(true);
    // AuthContext'teki resetPassword kullanılıyor (email normalization dahil)
    const result = await resetPassword(email);
    setLoading(false);

    if (result.success) {
      setIsSent(true);
    } else {
      // DEBUG: Gerçek hatayı göster
      let msg = result.error || "Bilinmeyen hata";
      alertError('Hata Detayı', msg);
    }
  };

  const openEmailApp = () => {
      // Basitçe mail uygulamasını açmaya çalışır (Android/iOS)
      if (Platform.OS === 'android') {
        Linking.openURL('mailto:');
      } else {
        Linking.openURL('message:');
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{flex:1}}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            
            {/* GERİ BUTONU */}
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.content}>
                
                {/* --- DURUM 1: HENÜZ GÖNDERİLMEDİ --- */}
                {!isSent ? (
                    <>
                        <View style={styles.iconCircle}>
                            <Ionicons name="lock-open" size={40} color={COLORS.primary} />
                        </View>
                        
                        <Text style={styles.title}>Şifreni Sıfırla</Text>
                        <Text style={styles.subtitle}>
                            Kayıtlı e-posta adresini gir, sana sıfırlama linki gönderelim.
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={{marginRight: 10}} />
                            <TextInput
                                style={styles.input}
                                placeholder="E-posta Adresiniz"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity 
                            style={styles.resetBtn} 
                            onPress={handleReset}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.btnText}>Sıfırlama Linki Gönder</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    /* --- DURUM 2: LİNK GÖNDERİLDİ (BAŞARILI) --- */
                    <>
                        <View style={[styles.iconCircle, {backgroundColor: '#dcfce7'}]}>
                            <Ionicons name="checkmark" size={40} color="#16a34a" />
                        </View>
                        
                        <Text style={styles.title}>E-Posta Gönderildi! 🚀</Text>
                        <Text style={styles.subtitle}>
                            <Text style={{fontWeight:'bold', color:'#333'}}>{email}</Text> adresine bir link gönderdik.
                        </Text>

                        <View style={styles.warningBox}>
                            <Ionicons name="alert-circle" size={24} color="#b45309" />
                            <Text style={styles.warningText}>
                                E-posta gelmediyse lütfen <Text style={{fontWeight:'bold'}}>SPAM (Gereksiz)</Text> kutusunu kontrol edin.
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.openMailBtn} onPress={openEmailApp}>
                            <Text style={styles.openMailText}>E-Posta Uygulamasını Aç</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setIsSent(false)} style={{marginTop: 20}}>
                            <Text style={{color: COLORS.primary, fontWeight:'600'}}>Tekrar Dene / E-postayı Düzenle</Text>
                        </TouchableOpacity>
                    </>
                )}

            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { flex: 1, padding: 24 },
  backBtn: { width: 40, height: 40, justifyContent:'center', alignItems:'center', borderRadius: 20, backgroundColor:'white', elevation:2, marginBottom: 20 },
  content: { alignItems: 'center', marginTop: 20 },
  
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 15, height: 55, width: '100%', marginBottom: 20, borderWidth:1, borderColor:'#e5e7eb' },
  input: { flex: 1, height: '100%', fontSize: 16 },
  
  resetBtn: { backgroundColor: COLORS.primary, width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // Başarılı Ekran Stilleri
  warningBox: { flexDirection:'row', backgroundColor: '#fffbeb', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#fcd34d', marginBottom: 20, alignItems:'center' },
  warningText: { color: '#92400e', marginLeft: 10, flex:1, fontSize: 14 },
  
  openMailBtn: { backgroundColor: '#374151', width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  openMailText: { color: 'white', fontWeight: 'bold' }
});