// src/context/AuthContext.js
// =====================================================
// KULLANICI YETKİLENDİRME VE CÜZDAN YÖNETİMİ
// @react-native-firebase (Native SDK) kullanıyor
// =====================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { PRICING } from '../config/pricing';

const AuthContext = createContext();

const INITIAL_PROFILE = {
  name: 'Misafir',
  fullname: '',
  bio: '',
  phone: '',
  photo: null,
  skills: [],
  credits: 0,
  isSubscriptionActive: false,
  isVerifiedBadge: false,
  isVip: false,
  favorites: [],
  walletBalance: 0
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profil Verileri
  const [userProfile, setUserProfile] = useState(INITIAL_PROFILE);
  const [customerProfile, setCustomerProfile] = useState(INITIAL_PROFILE);

  // Listener Ref
  const profileUnsubscribeRef = useRef(null);

  // --- 1. OTURUM DURUMUNU DİNLE ---
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserRoleAndProfile(currentUser.uid);
      } else {
        cleanupListener();
        setUser(null);
        setUserRole(null);
        setUserProfile(INITIAL_PROFILE);
        setCustomerProfile(INITIAL_PROFILE);
      }
      setLoading(false);
    });

    return () => {
        unsubscribe();
        cleanupListener();
    };
  }, []);

  const cleanupListener = () => {
    if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
    }
  };

  // --- 2. ROL VE PROFİL VERİSİNİ ÇEK ---
  const fetchUserRoleAndProfile = async (uid) => {
    try {
      cleanupListener();

      const userDocRef = firestore().collection('users').doc(uid);

      const unsub = userDocRef.onSnapshot(async (docSnap) => {
        if (docSnap.exists) {
          const data = docSnap.data();

          // Kullanıcı banlandıysa çıkış yap
          if (data.isBanned) {
            await auth().signOut();
            return;
          }

          const role = data.role;
          setUserRole(role);

          // Bakiye yoksa 0 olarak ayarla
          const profileData = {
            ...data,
            walletBalance: data.walletBalance || 0
          };

          if (role === 'pro') {
            setUserProfile(prev => ({ ...prev, ...profileData }));
          } else {
            setCustomerProfile(prev => ({ ...prev, ...profileData }));
          }
        }
      }, (error) => {
          console.log("Profil dinleme hatası:", error.code);
      });

      profileUnsubscribeRef.current = unsub;
      return unsub;
    } catch (error) {
      console.error("Profil çekme hatası:", error);
    }
  };

  // --- 3. LOGIN ---
  const login = async (email, password) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const result = await auth().signInWithEmailAndPassword(normalizedEmail, password);

      // Banned user kontrolü
      const userDoc = await firestore().collection('users').doc(result.user.uid).get();
      if (userDoc.exists && userDoc.data()?.isBanned) {
        await auth().signOut();
        return { success: false, error: 'Hesabınız askıya alınmıştır. Destek ile iletişime geçin.' };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // --- 4. REGISTER ---
  const register = async (email, password, role, consents = {}) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const response = await auth().createUserWithEmailAndPassword(normalizedEmail, password);
      const uid = response.user.uid;

      await firestore().collection('users').doc(uid).set({
        email: normalizedEmail,
        role,
        ...INITIAL_PROFILE,
        walletBalance: 0,
        isSubscriptionActive: role === 'pro' ? false : true,
        createdAt: firestore.FieldValue.serverTimestamp(),

        // KVKK Onayları
        kvkkConsents: {
          privacyPolicy: {
            accepted: consents.privacyPolicy || false,
            acceptedAt: consents.privacyPolicy ? firestore.FieldValue.serverTimestamp() : null,
            version: '1.0',
          },
          termsOfUse: {
            accepted: consents.termsOfUse || false,
            acceptedAt: consents.termsOfUse ? firestore.FieldValue.serverTimestamp() : null,
            version: '1.0',
          },
          explicitConsent: {
            accepted: consents.explicitConsent || false,
            acceptedAt: consents.explicitConsent ? firestore.FieldValue.serverTimestamp() : null,
            version: '1.0',
          },
          marketingConsent: {
            accepted: consents.marketingConsent || false,
            acceptedAt: consents.marketingConsent ? firestore.FieldValue.serverTimestamp() : null,
          },
        },

        // Kayıt bilgileri
        registrationInfo: {
          timestamp: firestore.FieldValue.serverTimestamp(),
          platform: 'mobile',
        },
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // --- 5. LOGOUT ---
  const logout = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
          await firestore().collection('users').doc(currentUser.uid).update({
              pushToken: null
          });
      }

      cleanupListener();
      await AsyncStorage.removeItem('my_session_id');
      await auth().signOut();

      // State'leri tamamen sıfırla
      setUser(null);
      setUserRole(null);
      setUserProfile(INITIAL_PROFILE);
      setCustomerProfile(INITIAL_PROFILE);

    } catch (e) {
      console.log("Logout hatası:", e);
    }
  };

  // --- 6. ŞİFRE SIFIRLAMA ---
  const resetPassword = async (email) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      await auth().sendPasswordResetEmail(normalizedEmail);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // =====================================================
  // CÜZDAN / BAKİYE FONKSİYONLARI
  // =====================================================

  // --- 7. BAKİYE KONTROL ---
  const checkBalance = (requiredAmount) => {
    const currentBalance = customerProfile?.walletBalance || 0;
    return currentBalance >= requiredAmount;
  };

  // --- 8. BAKİYE KULLAN (İlan açarken) - ATOMİK İŞLEM ---
  const deductBalance = async (amount, description = 'İlan ücreti') => {
    if (!user) return { success: false, error: 'Oturum açık değil' };

    try {
      const userRef = firestore().collection('users').doc(user.uid);
      const txRef = firestore().collection('transactions').doc();

      const result = await firestore().runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const currentBalance = userSnap.data()?.walletBalance || 0;

        if (currentBalance < amount) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        const newBalance = currentBalance - amount;

        transaction.update(userRef, {
          walletBalance: newBalance
        });

        transaction.set(txRef, {
          userId: user.uid,
          type: 'expense',
          amount: -amount,
          description: description,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          createdAt: firestore.FieldValue.serverTimestamp()
        });

        return { currentBalance, newBalance };
      });

      return {
        success: true,
        newBalance: result.newBalance
      };

    } catch (error) {
      if (error.message === 'INSUFFICIENT_BALANCE') {
        return { success: false, error: 'Yetersiz bakiye' };
      }
      console.error("Bakiye kullanım hatası:", error);
      return { success: false, error: error.message };
    }
  };

  // --- 9. BAKİYE YÜKLE - ATOMİK İŞLEM ---
  const addBalance = async (amount, paymentMethod = 'manual', paymentId = null) => {
    if (!user) return { success: false, error: 'Oturum açık değil' };

    try {
      const userRef = firestore().collection('users').doc(user.uid);
      const txRef = firestore().collection('transactions').doc();

      // Bonus hesapla
      const packageInfo = PRICING.BALANCE_PACKAGES.find(p => p.amount === amount);
      const bonus = packageInfo?.bonus || 0;
      const totalToAdd = amount + bonus;

      const result = await firestore().runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const currentBalance = userSnap.data()?.walletBalance || 0;
        const newBalance = currentBalance + totalToAdd;

        transaction.update(userRef, {
          walletBalance: newBalance
        });

        transaction.set(txRef, {
          userId: user.uid,
          type: 'deposit',
          amount: totalToAdd,
          originalAmount: amount,
          bonus: bonus,
          description: bonus > 0 ? `Bakiye yükleme (+${bonus}₺ bonus)` : 'Bakiye yükleme',
          paymentMethod: paymentMethod,
          paymentId: paymentId,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          createdAt: firestore.FieldValue.serverTimestamp()
        });

        return { currentBalance, newBalance, bonus };
      });

      return {
        success: true,
        newBalance: result.newBalance,
        bonus: result.bonus
      };

    } catch (error) {
      console.error("Bakiye yükleme hatası:", error);
      return { success: false, error: error.message };
    }
  };

  // --- 10. GÜNCEL BAKİYEYİ GETİR ---
  const getBalance = () => {
    return customerProfile?.walletBalance || 0;
  };

  // --- 11. VIP KONTROL ---
  const isVipCustomer = () => {
    return customerProfile?.isVip === true;
  };

  // Profil güncelleme fonksiyonları
  const updateProfile = (d) => setUserProfile(prev => ({ ...prev, ...d }));
  const updateCustomerProfile = (d) => setCustomerProfile(prev => ({ ...prev, ...d }));

  return (
    <AuthContext.Provider value={{
      // Temel auth
      user,
      userRole,
      loading,
      userProfile,
      customerProfile,
      login,
      register,
      logout,
      resetPassword,
      updateProfile,
      updateCustomerProfile,

      // Cüzdan fonksiyonları
      checkBalance,
      deductBalance,
      addBalance,
      getBalance,
      isVipCustomer,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
