import firestore from '@react-native-firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import CustomAlert from '../components/CustomAlert';
import { THEME } from '../constants/colors';
import { useAuth } from './AuthContext';
// Push Bildirimi Gönderme Yardımcısı
import { sendPushNotification } from '../utils/pushNotificationHelper';

// Varsayılan Veriler (Fallback)
import { SERVICE_CATALOG as DEFAULT_SERVICES } from '../constants/data';
const DEFAULT_CITIES = ["Tümü", "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"];

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const { user } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const theme = isDarkMode ? (THEME?.dark || {}) : (THEME?.light || {});

  // Dinamik Veriler
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [cities, setCities] = useState(DEFAULT_CITIES);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Bildirimler
  const [notifications, setNotifications] = useState([]);
  const notificationUnsubRef = useRef(null);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  // --- 1. METADATA (Şehirler & Hizmetler) ÇEKME ---
  useEffect(() => {
    const fetchMetadata = async () => {
        try {
             const sDoc = await firestore().collection('metadata').doc('services').get();
             if (sDoc.exists) setServices(sDoc.data().list || DEFAULT_SERVICES);

             const cDoc = await firestore().collection('metadata').doc('cities').get();
             if (cDoc.exists) setCities(cDoc.data().list || DEFAULT_CITIES);
        } catch (e) {
            console.log("Metadata hatası:", e);
        } finally {
            setLoadingMetadata(false);
        }
    };
    fetchMetadata();
  }, []);

  // --- 1.5. KULLANICI TEMA TERCİHİNİ YÜKLE ---
  useEffect(() => {
    const loadUserTheme = async () => {
      if (user?.uid) {
        try {
          // Auth token'ın hazır olmasını bekle
          await new Promise(resolve => setTimeout(resolve, 300));
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setIsDarkMode(userData.isDarkMode || false);
          }
        } catch (e) {
          // Auth henüz hazır değilse sessizce geç
          if (e.code !== 'firestore/permission-denied') {
            console.log("Tema yükleme hatası:", e);
          }
        }
      } else {
        // Kullanıcı çıkış yaptıysa varsayılan temaya dön
        setIsDarkMode(false);
      }
      setThemeLoaded(true);
    };
    loadUserTheme();
  }, [user?.uid]);

  // --- 2. BİLDİRİMLERİ DİNLEME ---
  useEffect(() => {
    // Önceki dinleyiciyi temizle
    if (notificationUnsubRef.current) {
        notificationUnsubRef.current();
        notificationUnsubRef.current = null;
    }

    // Eğer kullanıcı yoksa bildirimleri boşalt ve dur
    if (!user) {
        setNotifications([]);
        return;
    }

    // Yeni dinleyici başlat
    const unsub = firestore()
        .collection('notifications')
        .where('targetUserId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);
        }, (error) => {
            console.log("Bildirim dinleme uyarısı:", error.code);
        });

    notificationUnsubRef.current = unsub;

    return () => {
        if (notificationUnsubRef.current) {
            notificationUnsubRef.current();
        }
    };
  }, [user]);

  // --- 3. BİLDİRİM GÖNDERME FONKSİYONU ---
  const sendNotification = async ({ text, targetUserId, targetRole, data = {} }) => {
    try {
        // 1. Firestore'a Kaydet
        await firestore().collection('notifications').add({
            text,
            targetUserId,
            targetRole,
            data,
            read: false,
            createdAt: firestore.FieldValue.serverTimestamp()
        });

        // 2. Push Bildirim Gönder
        const userDoc = await firestore().collection('users').doc(targetUserId).get();
        if (userDoc.exists) {
            const token = userDoc.data().pushToken;
            if (token) {
                await sendPushNotification(token, "Yeni Bildirim 🔔", text, data);
            }
        }
    } catch (error) {
        console.error("Bildirim gönderme hatası:", error);
    }
  };

  // --- 4. OKUNDU İŞARETLEME ---
  const markNotificationsAsRead = async (role) => {
    const unread = notifications.filter(n => !n.read && n.targetRole === role);

    unread.forEach(async (notif) => {
        try {
            await firestore().collection('notifications').doc(notif.id).update({ read: true });
        } catch (e) { console.log(e); }
    });
  };

  // Okunmamış Sayıları
  const customerUnreadCount = notifications.filter(n => !n.read && n.targetRole === 'customer').length;
  const proUnreadCount = notifications.filter(n => !n.read && n.targetRole === 'pro').length;

  // --- TEMA DEĞİŞTİRME ---
  const toggleTheme = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);

    if (user) {
      try {
        await firestore().collection('users').doc(user.uid).update({
          isDarkMode: newValue
        });
      } catch (e) {
        console.log("Tema kaydetme hatası:", e);
      }
    }
  };

  // --- CUSTOM ALERT FONKSİYONLARI ---
  const showAlert = (type, title, message, buttons = []) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  // Kısa yollar
  const alertSuccess = (title, message, buttons) => showAlert('success', title, message, buttons);
  const alertError = (title, message, buttons) => showAlert('error', title, message, buttons);
  const alertWarning = (title, message, buttons) => showAlert('warning', title, message, buttons);
  const alertInfo = (title, message, buttons) => showAlert('info', title, message, buttons);

  return (
    <UIContext.Provider value={{
        theme,
        toggleTheme,
        isDarkMode,
        services,
        cities,
        loadingMetadata,
        notifications,
        customerUnreadCount,
        proUnreadCount,
        sendNotification,
        markNotificationsAsRead,
        // Custom Alert
        showAlert,
        hideAlert,
        alertSuccess,
        alertError,
        alertWarning,
        alertInfo,
    }}>
      {children}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
