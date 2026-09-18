import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useState } from 'react';
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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { alertSuccess, alertError, alertWarning } = useUI(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // ✅ YENİ: KVKK Onayları
  const [consents, setConsents] = useState({
    privacyPolicy: false,
    termsOfUse: false,
    explicitConsent: false,
    marketingConsent: false,
  });
  
  const checkEmailRole = async (email, selectedRole) => {
    try {
      const snapshot = await firestore().collection('users')
        .where('email', '==', email.toLowerCase().trim())
        .get();
      
      if (!snapshot.empty) {
        const existingUser = snapshot.docs[0].data();
        const existingRole = existingUser.role;
        
        if (existingRole !== selectedRole) {
          const roleText = existingRole === 'pro' ? 'Usta' : 'Müşteri';
          return {
            exists: true,
            message: `Bu e-posta adresi zaten "${roleText}" olarak kayıtlı. Aynı e-posta ile farklı bir rol seçemezsiniz.`
          };
        }
        return {
          exists: true,
          message: 'Bu e-posta adresi zaten kullanılıyor.'
        };
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Email kontrol hatası:', error);
      return { exists: false };
    }
  };

  // ✅ YENİ: KVKK Toggle
  const toggleConsent = (consentType) => {
    setConsents({ ...consents, [consentType]: !consents[consentType] });
  };

  const handleRegister = async () => {
    if (email === '' || password === '') {
       alertError("Hata", "Lütfen tüm alanları doldurun.");
       return;
    }
    if (password !== confirmPassword) {
       alertError("Hata", "Şifreler uyuşmuyor.");
       return;
    }
    if (password.length < 6) {
       alertError("Hata", "Şifre en az 6 karakter olmalıdır.");
       return;
    }

    // ✅ YENİ: KVKK Kontrolleri
    if (!consents.privacyPolicy) {
      alertError('Hata', 'Gizlilik Politikası\'nı kabul etmelisiniz.');
      return;
    }
    if (!consents.termsOfUse) {
      alertError('Hata', 'Kullanım Koşulları\'nı kabul etmelisiniz.');
      return;
    }
    if (!consents.explicitConsent) {
      alertError('Hata', 'Kişisel verilerinizin işlenmesine açık rıza vermelisiniz.');
      return;
    }

    setLoading(true);

    // Firebase Auth zaten aynı email kontrolünü yapıyor (email-already-in-use)
    const response = await register(email, password, selectedRole, consents);
    setLoading(false);

    if (response.success) {
       // Kayıt başarılı - direkt uygulamaya yönlendir
       // createUserWithEmailAndPassword zaten otomatik login yapıyor
       if (selectedRole === 'pro') {
         navigation.reset({ index: 0, routes: [{ name: 'ProTabs' }] });
       } else {
         navigation.reset({ index: 0, routes: [{ name: 'CustomerTabs' }] });
       }
    } else {
       let msg = "Kayıt yapılamadı.";
       if (response.error.includes('email-already-in-use')) msg = "Bu e-posta zaten kullanılıyor.";
       if (response.error.includes('invalid-email')) msg = "Geçersiz e-posta adresi.";
       alertError("Hata", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <ScrollView 
          contentContainerStyle={{flexGrow: 1}} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
          </View>

          <View style={styles.content}>
              <View style={styles.titleContainer}>
                  <Text style={styles.title}>Hesap Oluştur</Text>
                  <Text style={styles.subText}>Hemen aramıza katıl ve hizmetleri keşfet.</Text>
              </View>

              {/* ROL SEÇİMİ */}
              <View style={styles.roleContainer}>
                  <TouchableOpacity 
                      style={[styles.roleBtn, selectedRole === 'customer' && styles.roleBtnActive]}
                      onPress={() => setSelectedRole('customer')}
                  >
                      <Ionicons name="person" size={20} color={selectedRole === 'customer' ? 'white' : '#6B7280'} />
                      <Text style={[styles.roleText, {color: selectedRole === 'customer' ? 'white' : '#374151'}]}>Müşteriyim</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                      style={[styles.roleBtn, selectedRole === 'pro' && styles.roleBtnActive]}
                      onPress={() => setSelectedRole('pro')}
                  >
                      <Ionicons name="construct" size={20} color={selectedRole === 'pro' ? 'white' : '#6B7280'} />
                      <Text style={[styles.roleText, {color: selectedRole === 'pro' ? 'white' : '#374151'}]}>Ustayım</Text>
                  </TouchableOpacity>
              </View>

              {/* BİLGİ NOTU */}
              <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={18} color="#3b82f6" />
                  <Text style={styles.infoText}>
                      Her e-posta adresi sadece bir rol ile kayıt olabilir.
                  </Text>
              </View>

              <View style={styles.formSection}>
                  {/* EMAIL */}
                  <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput 
                          placeholder="E-posta Adresi" 
                          placeholderTextColor="#9CA3AF"
                          style={styles.input} 
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                      />
                  </View>

                  {/* ŞİFRE */}
                  <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                          placeholder="Şifre (en az 6 karakter)"
                          placeholderTextColor="#9CA3AF"
                          style={styles.input}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="off"
                          textContentType="oneTimeCode"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Ionicons 
                            name={showPassword ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color="#9CA3AF" 
                          />
                      </TouchableOpacity>
                  </View>

                  {/* ŞİFRE TEKRAR */}
                  <View style={styles.inputContainer}>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                          placeholder="Şifre Tekrar"
                          placeholderTextColor="#9CA3AF"
                          style={styles.input}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="off"
                          textContentType="oneTimeCode"
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                          <Ionicons 
                            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color="#9CA3AF" 
                          />
                      </TouchableOpacity>
                  </View>

                  {/* ✅ YENİ: KVKK ONAYLA BÖLÜMÜ */}
                  <View style={styles.kvkkSection}>
                      <Text style={styles.kvkkTitle}>KVKK ve Gizlilik Onayları</Text>

                      {/* Gizlilik Politikası */}
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleConsent('privacyPolicy')}
                      >
                        <View style={styles.checkbox}>
                          {consents.privacyPolicy && (
                            <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                          )}
                        </View>
                        <Text style={styles.checkboxText}>
                          <Text style={styles.requiredStar}>* </Text>
                          <Text
                            style={styles.linkText}
                            onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
                          >
                            Gizlilik Politikası
                          </Text>
                          'nı okudum, kabul ediyorum.
                        </Text>
                      </TouchableOpacity>

                      {/* Kullanım Koşulları */}
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleConsent('termsOfUse')}
                      >
                        <View style={styles.checkbox}>
                          {consents.termsOfUse && (
                            <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                          )}
                        </View>
                        <Text style={styles.checkboxText}>
                          <Text style={styles.requiredStar}>* </Text>
                          <Text
                            style={styles.linkText}
                            onPress={() => navigation.navigate('Legal', { type: 'terms' })}
                          >
                            Kullanım Koşulları
                          </Text>
                          'nı okudum, kabul ediyorum.
                        </Text>
                      </TouchableOpacity>

                      {/* Açık Rıza */}
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleConsent('explicitConsent')}
                      >
                        <View style={styles.checkbox}>
                          {consents.explicitConsent && (
                            <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                          )}
                        </View>
                        <Text style={styles.checkboxText}>
                          <Text style={styles.requiredStar}>* </Text>
                          Kişisel verilerimin işlenmesine{' '}
                          <Text
                            style={styles.linkText}
                            onPress={() => navigation.navigate('Legal', { type: 'consent' })}
                          >
                            açık rıza
                          </Text>{' '}
                          veriyorum.
                        </Text>
                      </TouchableOpacity>

                      {/* Pazarlama (Opsiyonel) */}
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleConsent('marketingConsent')}
                      >
                        <View style={styles.checkbox}>
                          {consents.marketingConsent && (
                            <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                          )}
                        </View>
                        <Text style={styles.checkboxText}>
                          Kampanya ve duyuruların gönderilmesini kabul ediyorum.{' '}
                          <Text style={styles.optionalText}>(Opsiyonel)</Text>
                        </Text>
                      </TouchableOpacity>

                      {/* Bilgilendirme */}
                      <View style={styles.kvkkInfoBox}>
                        <Ionicons name="information-circle" size={16} color="#666" />
                        <Text style={styles.kvkkInfoText}>
                          Verileriniz KVKK kapsamında korunmaktadır.
                        </Text>
                      </View>
                  </View>

                  {/* KAYIT OL BUTONU */}
                  <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
                      {loading ? (
                          <ActivityIndicator color="white" />
                      ) : (
                          <>
                              <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                              <Ionicons name="arrow-forward" size={24} color="white" />
                          </>
                      )}
                  </TouchableOpacity>

              </View>

              <View style={styles.loginLinkContainer}>
                  <Text style={{color:'#6B7280'}}>Zaten hesabın var mı? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                      <Text style={{color: COLORS.primary, fontWeight:'bold'}}>Giriş Yap</Text>
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
    flex: 1, 
    backgroundColor: 'white' 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#F3F4F6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: { 
    flex: 1, 
    padding: 25, 
    justifyContent: 'center' 
  },
  titleContainer: { 
    marginBottom: 30 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#111827', 
    marginBottom: 5 
  },
  subText: { 
    fontSize: 16, 
    color: '#6B7280' 
  },
  roleContainer: {
    flexDirection: 'row', 
    gap: 15, 
    marginBottom: 25
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  infoText: {
    color: '#1e40af',
    fontSize: 12,
    marginLeft: 8,
    flex: 1
  },
  formSection: { 
    width: '100%' 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    borderRadius: 16, 
    height: 60, 
    paddingHorizontal: 20, 
    marginBottom: 20 
  },
  inputIcon: { 
    marginRight: 15 
  },
  roleBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 15, 
    borderRadius: 12, 
    backgroundColor: '#F3F4F6', 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  roleBtnActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary 
  },
  roleText: { 
    marginLeft: 8, 
    fontWeight: 'bold', 
    color: '#374151' 
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#1F2937', 
    fontWeight: '500', 
    height: '100%' 
  },
  
  // ✅ YENİ: KVKK STİLLERİ
  kvkkSection: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  kvkkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
    backgroundColor: 'white',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  requiredStar: {
    color: '#ff0000',
    fontWeight: 'bold',
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  optionalText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  kvkkInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  kvkkInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
    lineHeight: 16,
  },

  registerButton: { 
    backgroundColor: COLORS.primary, 
    height: 64, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    elevation: 10 
  },
  registerButtonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 10 
  },
  loginLinkContainer: {
    flexDirection: 'row', 
    marginTop: 20, 
    justifyContent: 'center'
  }
});
