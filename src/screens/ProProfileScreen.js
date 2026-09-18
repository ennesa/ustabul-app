// =====================================================
// 👷 USTA PROFİL EKRANI - GÜNCELLENMİŞ VERSİYON
// =====================================================
// Yeni Özellikler: Portföy Galerisi
// =====================================================

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
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

// --- CONTEXT IMPORTLARI ---
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProfileLogic } from '../hooks/useProfileLogic';

// --- YENİ: PORTFÖY BİLEŞENİ ---
import { PortfolioManager } from '../components/PortfolioGallery';

export default function ProProfileScreen({ navigation }) {
  // 1. Verileri Context'ten Çek
  const { userProfile, updateProfile, user } = useAuth();
  const { theme, services, alertSuccess, alertError, alertWarning } = useUI();

  // 2. Profil Yönetim Hook'u
  const { photo, setPhoto, loading, pickImage, saveProfile } = useProfileLogic(user, updateProfile, { alertSuccess, alertError, alertWarning });

  // 3. Yerel State'ler
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [selectedSkills, setSelectedSkills] = useState(userProfile?.skills || []);
  
  // 🆕 Portföy State
  const [portfolio, setPortfolio] = useState(userProfile?.portfolio || []);

  // Profil verisi geç gelirse güncelle
  useEffect(() => {
    if (userProfile) {
        if (!name) setName(userProfile.name || '');
        if (!phone) setPhone(userProfile.phone || '');
        if (!bio) setBio(userProfile.bio || '');
        if (selectedSkills.length === 0 && userProfile.skills) {
            setSelectedSkills(userProfile.skills);
        }
        if (userProfile.photo) {
            setPhoto(userProfile.photo);
        }
        // 🆕 Portföy
        if (userProfile.portfolio) {
            setPortfolio(userProfile.portfolio);
        }
    }
  }, [userProfile]);

  // Yetenek Seç/Kaldır
  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
        setSelectedSkills(prev => prev.filter(s => s !== skillId));
    } else {
        if (selectedSkills.length >= 5) {
            alertWarning("Sınır", "En fazla 5 uzmanlık alanı seçebilirsiniz.");
            return;
        }
        setSelectedSkills(prev => [...prev, skillId]);
    }
  };

  // Kaydetme İşlemi
  const handleSave = async () => {
    if (!name.trim()) { 
        alertError("Hata", "İsim alanı boş bırakılamaz."); 
        return; 
    }
    
    await saveProfile({
        name,
        phone,
        bio,
        skills: selectedSkills 
    }, userProfile?.photo, navigation); 
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar barStyle={theme.statusBar} />
      
      {/* --- HEADER --- */}
      <View style={[styles.header, {borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, {color: theme.text}]}>Profili Düzenle</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
                onPress={handleSave} 
                disabled={loading}
                style={[styles.iconBtn, { marginRight: 10 }]}
            >
                {loading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                    <Ionicons name="checkmark" size={28} color={COLORS.primary} />
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => navigation.navigate('Settings')} 
                style={styles.iconBtn}
            >
                <Ionicons name="settings-outline" size={24} color={theme.text} />
            </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{flex:1}}
      >
        <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 50}}>
            
            {/* 1. FOTOĞRAF ALANI */}
            <View style={{alignItems:'center', marginBottom: 20}}>
                <TouchableOpacity onPress={pickImage} style={{alignItems:'center'}}>
                    <View style={styles.photoContainer}>
                        {photo ? (
                            <Image source={{ uri: photo }} style={styles.photo} />
                        ) : (
                            <View style={[styles.photoPlaceholder, {backgroundColor: theme.input}]}>
                                <Ionicons name="person" size={40} color={theme.subText} />
                            </View>
                        )}
                        <View style={styles.editIcon}>
                            <Ionicons name="camera" size={16} color="white" />
                        </View>
                    </View>
                    <Text style={{marginTop:10, color: COLORS.primary, fontWeight:'bold', fontSize:14}}>
                        Fotoğrafı Değiştir
                    </Text>
                </TouchableOpacity>
            </View>

            {/* --- MAĞAZA / PREMIUM BUTONU --- */}
            <TouchableOpacity 
                style={[styles.storeButton, {backgroundColor: '#fffbeb', borderColor: '#fbbf24'}]}
                onPress={() => navigation.navigate('Store')}
            >
                <View style={{flexDirection:'row', alignItems:'center', flex:1}}>
                    <View style={{backgroundColor:'#f59e0b', padding:10, borderRadius:25, marginRight:15}}>
                        <Ionicons name="diamond" size={24} color="white" />
                    </View>
                    <View style={{flex:1}}>
                        <Text style={{fontWeight:'bold', color:'#92400e', fontSize:16}}>
                            {userProfile?.isSubscriptionActive ? 'Üyeliğin Aktif ✨' : 'Premium\'a Yükselt 🚀'}
                        </Text>
                        <Text style={{color:'#b45309', fontSize:12, marginTop:2}}>
                            {userProfile?.isSubscriptionActive ? 'Plan detaylarını incele veya uzat.' : 'Daha fazla iş fırsatı yakala!'}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#d97706" />
            </TouchableOpacity>

            {/* 2. KİŞİSEL BİLGİLER */}
            <Text style={[styles.sectionTitle, {color: theme.subText}]}>KİŞİSEL BİLGİLER</Text>
            
            <View style={styles.inputGroup}>
                <Text style={[styles.label, {color: theme.text}]}>Ad Soyad</Text>
                <TextInput 
                    style={[styles.input, {backgroundColor: theme.input, color: theme.text}]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Adınız Soyadınız"
                    placeholderTextColor={theme.subText}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, {color: theme.text}]}>Telefon</Text>
                <TextInput 
                    style={[styles.input, {backgroundColor: theme.input, color: theme.text}]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="0555 555 55 55"
                    placeholderTextColor={theme.subText}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, {color: theme.text}]}>Hakkında (Biyografi)</Text>
                <TextInput 
                    style={[
                        styles.input, 
                        {backgroundColor: theme.input, color: theme.text, height: 100, textAlignVertical: 'top'}
                    ]}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    placeholder="Müşterilerinize kendinizden ve tecrübenizden bahsedin..."
                    placeholderTextColor={theme.subText}
                />
            </View>

            {/* =====================================================
                🆕 3. PORTFÖY GALERİSİ (YENİ BÖLÜM)
            ===================================================== */}
            <View style={[styles.portfolioSection, {backgroundColor: theme.card, borderColor: theme.border}]}>
                <PortfolioManager
                    userId={user?.uid}
                    images={portfolio}
                    onUpdate={setPortfolio}
                    theme={theme}
                    maxImages={9}
                    alertWarning={alertWarning}
                    alertSuccess={alertSuccess}
                    alertError={alertError}
                />
            </View>

            {/* 4. UZMANLIK ALANLARI */}
            <Text style={[styles.sectionTitle, {color: theme.subText, marginTop: 10}]}>
                UZMANLIK ALANLARI (Max 5)
            </Text>
            <Text style={{fontSize:12, color: theme.subText, marginBottom:10}}>
                Hizmet vermek istediğiniz kategorileri seçin.
            </Text>

            <View style={styles.skillsContainer}>
                {services && services.map((item) => {
                    const isSelected = selectedSkills.includes(item.id);
                    return (
                        <TouchableOpacity 
                            key={item.id}
                            style={[
                                styles.skillBadge, 
                                isSelected 
                                    ? {backgroundColor: COLORS.primary, borderColor: COLORS.primary} 
                                    : {backgroundColor: theme.input, borderColor: theme.border}
                            ]}
                            onPress={() => toggleSkill(item.id)}
                        >
                            {isSelected && (
                                <Ionicons name="checkmark" size={14} color="white" style={{marginRight:4}} />
                            )}
                            <Text style={[
                                styles.skillText, 
                                isSelected ? {color:'white', fontWeight:'bold'} : {color: theme.text}
                            ]}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* BÜYÜK KAYDET BUTONU */}
            <TouchableOpacity 
                style={[styles.bigSaveBtn, {backgroundColor: COLORS.primary}, loading && {opacity: 0.7}]}
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.bigSaveText}>Değişiklikleri Kaydet</Text>
                )}
            </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderBottomWidth: 1 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconBtn: { padding: 5 },
  photoContainer: { width: 100, height: 100, borderRadius: 50, position: 'relative' },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  editIcon: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: COLORS.primary, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: 'white' 
  },
  storeButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 25, 
    borderWidth: 1, 
    elevation: 2 
  },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 5 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  
  // 🆕 Portföy Section
  portfolioSection: {
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  skillBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 20, 
    borderWidth: 1 
  },
  skillText: { fontSize: 14 },
  bigSaveBtn: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3
  },
  bigSaveText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
