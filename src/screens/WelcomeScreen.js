import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Karanlık Mod olsa bile burası hep Beyaz kalacak */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        
        {/* LOGO VE BAŞLIK */}
        <View style={styles.headerSection}>
            <View style={styles.logoCircle}>
                <Ionicons name="construct" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Ustabul</Text>
            <Text style={styles.subtitle}>Hizmet al veya hizmet ver.{"\n"}Seçim senin.</Text>
        </View>

        {/* BUTONLAR - İKİSİ DE AYNI TASARIM */}
        <View style={styles.buttonContainer}>
            
            {/* 1. MÜŞTERİ BUTONU */}
            <TouchableOpacity 
                style={styles.roleButton}
                onPress={() => navigation.navigate('CustomerTabs')}
            >
                <View style={styles.iconBox}>
                    <Ionicons name="person" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.textWrapper}>
                    <Text style={styles.roleTitle}>Hizmet Almak İstiyorum</Text>
                    <Text style={styles.roleSub}>Usta bul, teklif al, işini çöz.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
            </TouchableOpacity>

            {/* 2. USTA BUTONU (Tasarımı Müşteri ile aynı yapıldı) */}
            <TouchableOpacity 
                style={styles.roleButton}
                onPress={() => navigation.navigate('ProTabs')}
            >
                <View style={styles.iconBox}>
                    <Ionicons name="briefcase" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.textWrapper}>
                    <Text style={styles.roleTitle}>Hizmet Vermek İstiyorum</Text>
                    <Text style={styles.roleSub}>İş bul, teklif ver, kazan.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
            </TouchableOpacity>

        </View>

        {/* ALT BİLGİ */}
        <Text style={styles.footerText}>Devam ederek Kullanım Koşullarını kabul etmiş sayılırsınız.</Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', // Sabit Beyaz (Karanlık mod etkilemez)
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  
  // HEADER
  headerSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED', // Çok açık turuncu
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937', // Koyu Gri (Sabit)
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280', // Gri (Sabit)
    textAlign: 'center',
    lineHeight: 24,
  },

  // BUTONLAR
  buttonContainer: {
    width: '100%',
    gap: 20, // Butonlar arası boşluk
  },
  roleButton: {
    backgroundColor: '#FFFFFF', // Beyaz Kart
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6', // Çok hafif çerçeve
    // Güçlü Gölge Efekti
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8, 
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#FFF7ED', // İkon arkası açık turuncu
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textWrapper: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937', // Sabit Koyu
    marginBottom: 4,
  },
  roleSub: {
    fontSize: 13,
    color: '#9CA3AF', // Sabit Gri
  },

  // FOOTER
  footerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 40,
  },
});