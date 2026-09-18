import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirimlerin uygulama açıkken nasıl görüneceğini ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 1. İzin İste ve Token Al
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push bildirim izni verilmedi!');
      return;
    }

    // ✅ DÜZELTİLDİ: projectId güvenli şekilde alınıyor
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId 
      ?? Constants?.easConfig?.projectId;

    try {
      token = (await Notifications.getExpoPushTokenAsync({ 
        projectId: projectId 
      })).data;
      console.log("Cihaz Token:", token);
    } catch (e) {
      console.log("Token alma hatası:", e.message);
    }
  } else {
    console.log('Fiziksel cihaz kullanmalısınız (Simülatörde çalışmaz)');
  }

  return token;
}

// 2. Bildirim Gönder (Expo API Kullanarak)
export async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}