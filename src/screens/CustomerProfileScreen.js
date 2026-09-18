import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
// --- CONTEXT IMPORTLARI (Eksik olan burasıydı) ---
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext'; // <-- BU SATIR EKSİKTİ
import { useProfileLogic } from '../hooks/useProfileLogic';

export default function CustomerProfileScreen({ navigation }) {
  // 1. Context'ten verileri çek
  const { customerProfile, updateCustomerProfile, user, getBalance } = useAuth();
  
  // Tema verisini güvenli çekelim (Hata önleyici)
  const uiContext = useUI();
  const theme = uiContext?.theme || { background: '#FFFFFF', text: '#000000', card: '#FFFFFF', input: '#F3F4F6', subText: '#666666' };
  const alertSuccess = uiContext?.alertSuccess;
  const alertError = uiContext?.alertError;
  const alertWarning = uiContext?.alertWarning;

  // Hook kullanımı
  const { photo, setPhoto, loading, pickImage, saveProfile } = useProfileLogic(user, updateCustomerProfile, { alertSuccess, alertError, alertWarning });

  // 2. State tanımları (Güvenli erişim ?. ile)
  const [name, setName] = useState(customerProfile?.name || '');
  const [phone, setPhone] = useState(customerProfile?.phone || '');
  const [address, setAddress] = useState(customerProfile?.address || '');

  // Profil verisi güncellenince state'i de güncelle
  useEffect(() => {
      if (customerProfile) {
          setName(customerProfile.name || '');
          setPhone(customerProfile.phone || '');
          setAddress(customerProfile.address || '');
          setPhoto(customerProfile.photo);
      }
  }, [customerProfile]);

  // Kaydetme işlemi
  const handleSaveWrapper = () => {
    const cleanPhone = phone.replace(/\s/g, ''); 
    if (cleanPhone.length < 10) {
        alertWarning("Hatalı Numara", "Lütfen geçerli bir telefon numarası giriniz.");
        return; 
    }

    saveProfile(
        { name, phone: cleanPhone, address }, 
        customerProfile?.photo, 
        navigation
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      {/* HEADER */}
      <View style={[styles.header, {backgroundColor: theme.card}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>Profilim</Text>
        <View style={{flexDirection:'row', alignItems:'center', gap: 15}}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-outline" size={24} color={theme.text} />
            </TouchableOpacity>
            
            {/* KAYDET BUTONU */}
            <TouchableOpacity onPress={handleSaveWrapper} disabled={loading}>
                {loading ? (
                    <ActivityIndicator size="small" color={COLORS.green} />
                ) : (
                    <Ionicons name="checkmark-circle" size={28} color={COLORS.green} />
                )}
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{padding: 20}}>
        {/* FOTOĞRAF ALANI */}
        <View style={{alignItems: 'center', marginBottom: 20}}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, {backgroundColor: theme.input}]}>
                <Ionicons name="person" size={40} color={theme.subText} />
              </View>
            )}
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={14} color="white" />
            </View>
            
            {customerProfile?.isVip && (
                <View style={styles.vipBadgeOverlay}>
                    <Ionicons name="diamond" size={20} color="white" />
                </View>
            )}
          </TouchableOpacity>
          
          {/* VIP ise rozet göster */}
          {customerProfile?.isVip && (
              <View style={{marginTop: 15}}>
                  <View style={[styles.statusBadge, {backgroundColor: '#F59E0B'}]}>
                      <Text style={[styles.statusText, {color: 'white'}]}>👑 VIP MÜŞTERİ</Text>
                  </View>
              </View>
          )}
        </View>

        {/* 💰 CÜZDAN KARTI */}
        <TouchableOpacity 
          style={[styles.walletCard, {backgroundColor: COLORS.primary}]}
          onPress={() => navigation.navigate('CustomerWallet')}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={styles.walletIconBox}>
                <Ionicons name="wallet" size={24} color={COLORS.primary} />
              </View>
              <View style={{marginLeft: 15}}>
                <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12}}>Bakiyem</Text>
                <Text style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>{getBalance()} ₺</Text>
              </View>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <TouchableOpacity 
                style={styles.addBalanceBtn}
                onPress={() => navigation.navigate('CustomerWallet')}
              >
                <Ionicons name="add" size={18} color={COLORS.primary} />
                <Text style={{color: COLORS.primary, fontWeight: 'bold', marginLeft: 3}}>Yükle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* FORM ALANI */}
        <Text style={[styles.label, {color: theme.subText}]}>Ad Soyad</Text>
        <TextInput 
            style={[styles.input, {backgroundColor: theme.input, color: theme.text}]} 
            value={name} 
            onChangeText={setName} 
            placeholder="İsim" 
            placeholderTextColor={theme.subText} 
        />
        <Text style={[styles.label, {color: theme.subText}]}>Telefon</Text>
        <TextInput 
            style={[styles.input, {backgroundColor: theme.input, color: theme.text}]} 
            value={phone} 
            onChangeText={setPhone} 
            keyboardType="phone-pad" 
            placeholder="0555..." 
            placeholderTextColor={theme.subText}
            maxLength={11} 
        />
        <Text style={[styles.label, {color: theme.subText}]}>Adres</Text>
        <TextInput 
            style={[styles.input, {backgroundColor: theme.input, color: theme.text}]} 
            value={address} 
            onChangeText={setAddress} 
            placeholder="İlçe / Şehir" 
            placeholderTextColor={theme.subText} 
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  photoContainer: { width: 100, height: 100, borderRadius: 50, position: 'relative' },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.bg },
  vipBadgeOverlay: { position: 'absolute', bottom: -10, left: '50%', marginLeft: -16, backgroundColor: '#F59E0B', borderRadius: 16, padding: 6, zIndex: 10, borderWidth: 2, borderColor: 'white' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, alignItems:'center', justifyContent:'center' },
  statusText: { fontWeight: 'bold', fontSize: 11 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { padding: 15, borderRadius: 12, fontSize: 16 },
  
  // 💰 Cüzdan Kartı Stilleri
  walletCard: { 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  walletIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBalanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
});