import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export const compressImage = async (uri, alertWarning = null) => {
  try {
    // 1. DOSYA BOYUTU KONTROLÜ (5MB SINIRI)
    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
        if (alertWarning) {
            alertWarning('Uyarı', 'Seçilen resim çok büyük (Maksimum 5MB). Lütfen daha küçük bir resim seçin.');
        }
        return null; // İşlemi iptal et
    }

    // 2. RESMİ SIKIŞTIR VE YENİDEN BOYUTLANDIR
    // Genişlik 1080px, Yükseklik otomatik, Kalite %70
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }], 
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } 
    );
    
    return manipulatedImage.uri;

  } catch (error) {
    console.log("Resim sıkıştırma hatası:", error);
    // Eğer bir hata olursa (örn: dosya bozuksa), orijinal yolu geri döndürerek akışı bozma
    return uri; 
  }
};