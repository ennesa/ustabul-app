import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// ✅ EKLENDİ: Kalıcı veri saklamak için AsyncStorage import edildi
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';

// TANITIM SAYFALARI VERİSİ
const SLIDES = [
  {
    id: '1',
    title: 'Aradığın Usta\nBir Tık Uzağında',
    description: 'Boya, tesisat, montaj veya nakliye... İhtiyacın olan hizmeti seç, en iyi ustalarla anında buluş.',
    icon: 'construct'
  },
  {
    id: '2',
    title: 'Hızlıca Fiyat Al\nKarşılaştır',
    description: 'İşini anlat, ustalardan gelen teklifleri gör. Puanlarına ve yorumlarına bakarak en doğrusunu seç.',
    icon: 'wallet'
  },
  {
    id: '3',
    title: 'Güvenle Çöz\nRahat Et',
    description: 'İşin tamamlanana kadar yanındayız. Onaylanmış profillerle güvenli hizmetin keyfini çıkar.',
    icon: 'shield-checkmark'
  },
];

export default function OnboardingScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // Hangi sayfada olduğumuzu takip etme
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // ✅ YARDIMCI FONKSİYON: Onboarding tamamlandı olarak işaretle
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      navigation.replace('Login');
    } catch (error) {
      console.error('Onboarding durumu kaydedilemedi:', error);
      // Hata olsa bile kullanıcıyı login ekranına gönder
      navigation.replace('Login');
    }
  };

  // Butona basınca ilerle veya bitir
  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Son sayfadaysa kaydet ve git
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    // Atlarsa da kaydet ve git
    await completeOnboarding();
  };

  const renderItem = ({ item }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.iconContainer}>
           <Ionicons name={item.icon} size={100} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* ÜST GEÇ BUTONU */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Atla</Text>
      </TouchableOpacity>

      {/* SLIDER */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* ALT KISIM (NOKTALAR VE BUTON) */}
      <View style={[styles.footer, { height: height * 0.20 }]}>
        
        {/* NOKTALAR (INDICATOR) */}
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.activeIndicator
              ]}
            />
          ))}
        </View>

        {/* İLERİ / BAŞLA BUTONU */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Hemen Başla' : 'İleri'}
          </Text>
          <Ionicons 
            name={currentIndex === SLIDES.length - 1 ? "rocket" : "arrow-forward"} 
            size={20} 
            color="white" 
            style={{ marginLeft: 10 }} 
          />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 20,
    marginTop: 20
  },
  skipText: {
    color: COLORS.gray,
    fontWeight: '600',
    fontSize: 16
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    backgroundColor: 'white',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    elevation: 5, // Android gölge
    shadowColor: COLORS.primary, // iOS gölge
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20
  },
  footer: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  indicator: {
    height: 8,
    width: 8,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: COLORS.primary,
    width: 20, // Aktif olunca uzasın
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});