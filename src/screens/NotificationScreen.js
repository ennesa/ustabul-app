import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { FlatList, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// DOĞRU CONTEXT KULLANIMI
import { useUI } from '../context/UIContext';

export default function NotificationScreen({ route, navigation }) {
  // notification verisi ve okundu işaretleme fonksiyonu UIContext içinde
  const { notifications, markNotificationsAsRead, theme } = useUI(); 

  // Hangi rolde girdik?
  const { role } = route.params || { role: 'customer' };

  useEffect(() => {
    // Fonksiyon varsa çalıştır
    if (markNotificationsAsRead) {
        markNotificationsAsRead(role);
    }
  }, [role, markNotificationsAsRead]);

  // Sadece bana ait bildirimleri filtrele
  const myNotifications = notifications.filter(item => item.targetRole === role);

  const handlePress = (item) => {
      const data = item.data || {}; 

      if (data.type === 'CHAT') {
         navigation.navigate('ChatScreen', { 
             ustaName: data.ustaName || 'Sohbet',
             targetUserId: data.targetUserId,
             currentUserRole: role
         });
      } 
      else if (data.type === 'JOB') {
        if (data.jobId) {
        navigation.navigate('JobDetail', { job: { id: data.jobId } });
    } else {
        // ID yoksa mecburen geri dön
        console.warn("Bildirimde JobID eksik!");
        navigation.goBack();
    }
      }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
        onPress={() => handlePress(item)}
        style={[styles.card, {backgroundColor: theme.card}, !item.read && {borderLeftColor: theme.primary, borderLeftWidth: 4}]}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
            name={item.data?.type === 'CHAT' ? "chatbubble" : "notifications"} 
            size={24} 
            color={item.read ? theme.subText : theme.primary} 
        />
        {!item.read && <View style={[styles.dot, {borderColor: theme.card}]} />}
      </View>
      <View style={{flex: 1}}>
        <Text style={[styles.text, {color: theme.text}]}>{item.text}</Text>
        <Text style={[styles.date, {color: theme.subText}]}>{item.date}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.border} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={[styles.header, {backgroundColor: theme.card}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>
            Bildirimler ({role === 'pro' ? 'Usta' : 'Müşteri'})
        </Text>
        <View style={{width:24}} />
      </View>

      <FlatList
        data={myNotifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 20}}
        ListEmptyComponent={
            <View style={{alignItems:'center', marginTop: 50}}>
                <Ionicons name="notifications-off-outline" size={40} color={theme.subText} />
                <Text style={{color: theme.subText, marginTop:10}}>Henüz bildirim yok.</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  card: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 1 },
  iconContainer: { marginRight: 15, position: 'relative' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'red', position: 'absolute', top: 0, right: 0, borderWidth: 1 },
  text: { fontSize: 14, lineHeight: 20 },
  date: { fontSize: 12, marginTop: 5 }
});