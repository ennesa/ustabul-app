// =====================================================
// FIREBASE CONFIGURATION - NATIVE SDK
// =====================================================
// @react-native-firebase kullanıyor (Android credentials düzgün çalışır)
// =====================================================

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Native Firebase SDK - google-services.json'dan otomatik yapılandırılır
// Ayrıca manuel config gerekmez

// Auth instance
const firebaseAuth = auth();

// Firestore instance
const db = firestore();

// Storage instance
const firebaseStorage = storage();

export { firebaseAuth as auth, db, firebaseStorage as storage };
