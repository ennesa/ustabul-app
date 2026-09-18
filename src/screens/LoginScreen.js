import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useUI } from '../context/UIContext';

const REMEMBER_ME_KEY = '@ustabul_remember_me';
const SAVED_EMAIL_KEY = '@ustabul_saved_email';
const LEGACY_SAVED_PASSWORD_KEY = '@ustabul_saved_password';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme, alertWarning, alertError } = useUI();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      const savedEmail = await AsyncStorage.getItem(SAVED_EMAIL_KEY);
      // Eski sürümlerde düz metin kaydedilen şifreyi cihazdan temizle.
      await AsyncStorage.removeItem(LEGACY_SAVED_PASSWORD_KEY);

      if (savedRememberMe === 'true' && savedEmail) {
        setRememberMe(true);
        setEmail(savedEmail);
      }
    } catch (error) {
      console.log('Kayıtlı bilgi yükleme hatası:', error);
    }
  };

  // Yalnızca e-posta hatırlanır; şifre asla cihazda saklanmaz (oturum Firebase Auth'ta kalıcıdır).
  const saveCredentials = async (emailToSave) => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
        await AsyncStorage.setItem(SAVED_EMAIL_KEY, emailToSave);
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
        await AsyncStorage.removeItem(SAVED_EMAIL_KEY);
      }
    } catch (error) {
      console.log('Bilgi kaydetme hatası:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alertWarning('Eksik Bilgi', 'Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    setLoading(true);

    const response = await login(email, password);

    if (response.success) {
      await saveCredentials(email);

      try {
        const uid = auth().currentUser?.uid;

        if(uid) {
            const userDoc = await firestore().collection('users').doc(uid).get();
            if (userDoc.exists) {
                const role = userDoc.data().role;
                if (role === 'pro') {
                    navigation.reset({ index: 0, routes: [{ name: 'ProTabs' }] });
                } else {
                    navigation.reset({ index: 0, routes: [{ name: 'CustomerTabs' }] });
                }
            }
        }
      } catch (error) {
        console.error("Yönlendirme hatası:", error);
        navigation.navigate('CustomerTabs'); 
      }
    } else {
      if (response.error?.includes('askıya alınmıştır')) {
        alertError('Hesap Askıda', 'Hesabınız askıya alınmıştır. Destek ile iletişime geçin.');
      } else if (response.error?.includes('user-not-found') || response.error?.includes('invalid-credential')) {
        alertError('Kullanıcı Bulunamadı', 'Bu e-posta ile kayıtlı bir hesap bulunamadı. Lütfen kayıt olun.');
      } else if (response.error?.includes('wrong-password')) {
        alertError('Şifre Hatalı', 'Girdiğiniz şifre yanlış. Tekrar deneyin veya şifrenizi sıfırlayın.');
      } else {
        alertError('Giriş Başarısız', 'E-posta veya şifre hatalı.');
      }
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: 'white'}]}> 
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}
          keyboardShouldPersistTaps="handled"
        >
            
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                 <Ionicons name="construct" size={50} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Ustabul</Text>
              <Text style={styles.subtitle}>Tekrar Hoşgeldiniz!</Text>
            </View>

            <View style={styles.formContainer}>
              
              {/* EMAIL INPUT */}
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta Adresi"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* ŞİFRE INPUT */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* BENİ HATIRLA - Şifre kutusunun hemen altında, sol tarafta */}
              <View style={styles.rememberRow}>
                <TouchableOpacity 
                  style={styles.rememberMeButton}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkboxBox,
                    rememberMe && styles.checkboxBoxChecked
                  ]}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text style={styles.rememberMeLabel}>Beni Hatırla</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>Şifremi Unuttum?</Text>
                </TouchableOpacity>
              </View>

              {/* GİRİŞ YAP BUTONU */}
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.loginButtonText}>Giriş Yap</Text>
                )}
              </TouchableOpacity>

              {/* TELEFON İLE GİRİŞ - Şimdilik devre dışı (çift SDK sorunu) */}
              {/*
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => navigation.navigate('PhoneLogin')}
              >
                 <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Ionicons name="call" size={20} color={COLORS.primary} style={{marginRight: 10}} />
                    <Text style={styles.phoneButtonText}>Telefon ile Giriş</Text>
                 </View>
              </TouchableOpacity>
              */}

              {/* KAYIT OL */}
              <View style={styles.registerContainer}>
                <Text style={{color: '#64748b'}}>Hesabın yok mu? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={{color: COLORS.primary, fontWeight: 'bold'}}>Kayıt Ol</Text>
                </TouchableOpacity>
              </View>

            </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  keyboardView: { 
    flex: 1, 
    padding: 20 
  },
  
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  logoCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#e0f2fe', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#0f172a' 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#64748b', 
    marginTop: 5 
  },

  formContainer: { 
    width: '100%' 
  },
  
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f1f5f9', 
    borderRadius: 12, 
    marginBottom: 15, 
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  inputIcon: { 
    marginRight: 10 
  },
  input: { 
    flex: 1, 
    color: '#334155', 
    fontSize: 16 
  },
  
  /* BENİ HATIRLA SATIRI */
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 5
  },
  
  rememberMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5
  },
  
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  
  rememberMeLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500'
  },

  forgotText: {
    color: COLORS.primary, 
    fontSize: 13,
    fontWeight: '500'
  },
  
  loginButton: { 
    backgroundColor: COLORS.primary, 
    height: 55, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  loginButtonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },

  phoneButton: {
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    marginTop: 15,
    height: 55, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  phoneButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold'
  },
  
  registerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 30, 
    marginBottom: 20 
  },
});
