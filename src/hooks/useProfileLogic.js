// src/hooks/useProfileLogic.js

import * as ImagePicker from 'expo-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { useState } from 'react';
import { compressImage } from '../utils/imageHelper';

export const useProfileLogic = (user, updateContextProfile, alertFunctions = {}) => {
  const { alertSuccess, alertError, alertWarning } = alertFunctions;
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);

  // --- RESİM SEÇME ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      // Seçilen resmi sıkıştır ve state'e at
      const compressedUri = await compressImage(result.assets[0].uri, alertWarning);
      setPhoto(compressedUri);
    }
  };

  // --- RESMİ FIREBASE'E YÜKLEME (Private/Özel Fonksiyon) ---
  const _uploadImageToFirebase = async (uri) => {
    try {
      const filename = `users/${user.uid}/profile_${Date.now()}.jpg`;
      const storageRef = storage().ref(filename);

      await storageRef.putFile(uri);
      return await storageRef.getDownloadURL();
    } catch (error) {
      console.error("Upload hatası:", error);
      throw error;
    }
  };

  // --- PROFİLİ KAYDETME ---
  const saveProfile = async (newData, currentPhotoUrl, navigation) => {
    setLoading(true);
    try {
      let finalPhotoUrl = currentPhotoUrl;

      // Eğer yeni bir fotoğraf seçildiyse ve eskisiyle aynı değilse YÜKLE
      if (photo && photo !== currentPhotoUrl) {
        finalPhotoUrl = await _uploadImageToFirebase(photo);
      }

      const updatedData = {
        ...newData,
        photo: finalPhotoUrl
      };

      // 1. Firestore Güncelle
      await firestore().collection('users').doc(user.uid).update(updatedData);

      // 2. Context (Uygulama Hafızası) Güncelle
      updateContextProfile(updatedData);

      if (alertSuccess) alertSuccess("Başarılı", "Profil bilgileriniz güncellendi!");
      if(navigation) navigation.goBack();

    } catch (error) {
      if (alertError) alertError("Hata", "Güncelleme başarısız: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    photo,
    setPhoto,
    loading,
    pickImage,
    saveProfile
  };
};
