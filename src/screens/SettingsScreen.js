import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
// --- CONTEXT IMPORTLARI ---
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

// FIREBASE IMPORTLARI
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// PUSH NOTIFICATION
import { registerForPushNotificationsAsync } from "../utils/pushNotificationHelper";

export default function SettingsScreen({ navigation }) {
  const { theme, toggleTheme, isDarkMode, alertSuccess, alertError, alertWarning, alertInfo } = useUI();
  const { logout, user } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // --- BİLDİRİM TERCİHİNİ FIRESTORE'DAN YÜKLE ---
  useEffect(() => {
    const loadNotificationPreference = async () => {
      if (user) {
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const data = userDoc.data();
            // pushToken varsa bildirimler açık demektir
            setNotificationsEnabled(data.pushToken !== null && data.pushToken !== undefined);
          }
        } catch (error) {
          console.log("Bildirim tercihi yüklenemedi:", error);
        }
      }
    };
    loadNotificationPreference();
  }, [user]);

  // --- BİLDİRİM TERCİHİNİ DEĞİŞTİR ---
  const handleNotificationToggle = async (value) => {
    if (!user || notificationLoading) return;

    setNotificationLoading(true);
    setNotificationsEnabled(value);

    try {
      const userRef = firestore().collection('users').doc(user.uid);

      if (value) {
        // Bildirimleri AÇ - Push token'ı kaydet
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await userRef.update({ pushToken: token });
          alertSuccess("Başarılı", "Bildirimler açıldı.");
        } else {
          // Token alınamadıysa (izin verilmediyse)
          setNotificationsEnabled(false);
          alertWarning(
            "İzin Gerekli",
            "Bildirimleri açmak için cihaz ayarlarından uygulama bildirimlerine izin vermeniz gerekiyor."
          );
        }
      } else {
        // Bildirimleri KAPAT - Push token'ı sil
        await userRef.update({ pushToken: null });
        alertSuccess("Başarılı", "Bildirimler kapatıldı.");
      }
    } catch (error) {
      console.log("Bildirim ayarı hatası:", error);
      setNotificationsEnabled(!value); // Geri al
      alertError("Hata", "Bildirim ayarı değiştirilemedi.");
    } finally {
      setNotificationLoading(false);
    }
  };

  // --- ÇIKIŞ YAP FONKSİYONU ---
  const handleLogout = () => {
    alertWarning("Çıkış Yap", "Hesabınızdan çıkmak istediğinize emin misiniz?", [
      { text: "Vazgeç" },
      {
        text: "Çıkış Yap",
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  // --- HESAP SİLME FONKSİYONU ---
  const handleDeleteAccount = () => {
    alertError(
      "Hesabı Sil",
      "DİKKAT! Hesabınız, ilanlarınız ve tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç" },
        {
          text: "Hesabımı Sil",
          onPress: async () => {
            try {
              if (user) {
                const uid = user.uid;
                // 1. Firestore verisini sil (hala auth var)
                await firestore().collection('users').doc(uid).delete();
                // 2. Auth hesabını sil (onAuthStateChanged otomatik cleanup yapar)
                await auth().currentUser.delete();
                // 3. Login ekranına yönlendir
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }
            } catch (error) {
              alertError(
                "Hata",
                "Güvenlik gereği hesabınızı silmek için uygulamadan çıkıp tekrar giriş yapmanız gerekmektedir."
              );
            }
          },
        },
      ]
    );
  };

  const MenuItem = ({ icon, title, onPress, color, subText, rightElement }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: theme.border }]}
      onPress={onPress}
      disabled={!!rightElement}
    >
      <View style={styles.menuLeft}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: (color || theme.text) + "15" },
          ]}
        >
          <Ionicons name={icon} size={22} color={color || theme.text} />
        </View>
        <View>
          <Text style={[styles.menuText, { color: color || theme.text }]}>
            {title}
          </Text>
          {subText && (
            <Text style={{ fontSize: 10, color: theme.subText }}>
              {subText}
            </Text>
          )}
        </View>
      </View>
      {rightElement ? (
        rightElement
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.subText} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ayarlar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.sectionHeader, { color: theme.subText }]}>
          GÖRÜNÜM
        </Text>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <MenuItem
            icon="moon-outline"
            title="Karanlık Mod"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: theme.primary }}
              />
            }
          />
        </View>

        <Text style={[styles.sectionHeader, { color: theme.subText }]}>
          HESAP
        </Text>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <MenuItem
            icon="key-outline"
            title="Şifre Değiştir"
            onPress={() =>
              alertInfo(
                "Bilgi",
                "Şifre değiştirme bağlantısı e-posta adresinize gönderildi."
              )
            }
          />

          <MenuItem
            icon="notifications-outline"
            title="Bildirimler"
            subText={notificationsEnabled ? "Açık" : "Kapalı"}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: "#767577", true: theme.primary }}
                disabled={notificationLoading}
              />
            }
          />
        </View>

        {/* --- DESTEK KISMI (GÜNCELLENDİ) --- */}
        <Text style={[styles.sectionHeader, { color: theme.subText }]}>
          DESTEK
        </Text>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <MenuItem
            icon="mail-outline"
            title="Bize Ulaşın"
            onPress={() => Linking.openURL("mailto:destek@ustabul.com")}
          />

          {/* ✅ YENİ: KVKK Ayarları */}
          <MenuItem
            icon="shield-checkmark"
            title="KVKK Ayarları"
            color={COLORS.primary}
            onPress={() => navigation.navigate("KVKKSettings")}
          />

          <MenuItem
            icon="document-text-outline"
            title="Kullanım Koşulları"
            onPress={() => navigation.navigate("Legal", { type: "terms" })}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            title="Gizlilik Politikası"
            onPress={() => navigation.navigate("Legal", { type: "privacy" })}
          />
        </View>

        <Text style={[styles.sectionHeader, { color: theme.subText }]}>
          DİĞER
        </Text>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <MenuItem
            icon="log-out-outline"
            title="Çıkış Yap"
            color="#ef4444"
            onPress={handleLogout}
          />
          <MenuItem
            icon="trash-outline"
            title="Hesabımı Sil"
            color="#ef4444"
            onPress={handleDeleteAccount}
          />
        </View>

        <Text style={[styles.versionText, { color: theme.subText }]}>
          Ustabul v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 5,
    marginTop: 10,
  },
  section: { borderRadius: 15, marginBottom: 20, overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 35,
    height: 35,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  menuText: { fontSize: 16, fontWeight: "500" },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 20,
  },
});
