import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { getConversationId } from '../utils/chatHelper';
import { sendPushNotification } from '../utils/pushNotificationHelper';

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export default function ChatScreen({ route, navigation }) {
  const { ustaName, jobId } = route.params; 
  const initialTargetId = route.params.targetUserId || null;
  const paramUserRole = route.params.currentUserRole;

  const { theme, sendNotification, alertSuccess, alertError, alertWarning } = useUI(); 
  const { user, userProfile, userRole } = useAuth();
  
  // ✅ DÜZELTİLDİ: currentUserRole route params'tan veya AuthContext'ten alınıyor
  const currentUserRole = paramUserRole || userRole;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [optionsVisible, setOptionsVisible] = useState(false); 
  const [isBlocked, setIsBlocked] = useState(false); 
  
  const [isChatDisabled, setIsChatDisabled] = useState(false); 
  const [targetUserId, setTargetUserId] = useState(initialTargetId);

  const conversationId = (user && targetUserId) ? getConversationId(user.uid, targetUserId) : null;

  useEffect(() => {
    if (!jobId) return;

    const checkJobStatus = async () => {
        try {
            const jobRef = firestore().collection('jobs').doc(jobId);
            const jobSnap = await jobRef.get();

            if (jobSnap.exists) {
                const status = jobSnap.data().status;
                if (status === 'Değerlendirildi') {
                    setIsChatDisabled(true);
                }
            }
        } catch (error) {
            console.error("İş durumu kontrol hatası:", error);
        }
    };

    checkJobStatus();
  }, [jobId]);

  const markMessagesAsRead = async (msgIds) => {
    if (!conversationId || msgIds.length === 0) return;

    try {
        const batch = firestore().batch();
        msgIds.forEach(id => {
            const docRef = firestore().collection('conversations').doc(conversationId).collection('messages').doc(id);
            batch.update(docRef, { read: true });
        });
        const convRef = firestore().collection('conversations').doc(conversationId);
        batch.update(convRef, {
            [`unreadCounts.${user.uid}`]: 0 
        });
        await batch.commit();
    } catch (err) {
        console.log("Okundu bilgisi güncellenemedi:", err);
    }
  };

  useEffect(() => {
    if (!user || !targetUserId || !conversationId) return;

    const messagesRef = firestore().collection('conversations').doc(conversationId).collection('messages');

    let q;
    if (jobId) {
        q = messagesRef.where('jobId', '==', jobId).orderBy('createdAt', 'asc');
    } else {
        q = messagesRef.orderBy('createdAt', 'asc');
    }

    const unsubscribe = q.onSnapshot((snapshot) => {
      const msgs = [];
      const unreadMsgIds = [];

      snapshot.docs.forEach(docSnapshot => {
          const data = docSnapshot.data();
          msgs.push({ id: docSnapshot.id, ...data });

          if (data.receiverId === user.uid && !data.read) {
              unreadMsgIds.push(docSnapshot.id);
          }
      });
      
      setMessages(msgs);

      if (unreadMsgIds.length > 0) {
          markMessagesAsRead(unreadMsgIds);
      }
    });

    checkIfBlocked();

    return () => unsubscribe();
  }, [conversationId, targetUserId, jobId]);

  const checkIfBlocked = async () => {
    if (!user || !targetUserId) return;
    const userRef = firestore().collection('users').doc(user.uid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
        const userData = userSnap.data();
        if (userData.blockedUsers && userData.blockedUsers.includes(targetUserId)) {
            setIsBlocked(true);
        }
    }
  };

  const handleBlockToggle = async () => {
      if (!targetUserId) { alertError("Hata", "Kullanıcı bilgisi yok."); return; }
      const userRef = firestore().collection('users').doc(user.uid);
      try {
          if (isBlocked) {
              await userRef.update({ blockedUsers: firestore.FieldValue.arrayRemove(targetUserId) });
              setIsBlocked(false);
              alertSuccess("Bilgi", "Engel kaldırıldı.");
          } else {
              alertWarning("Engelle", "Emin misin?", [{ text: "Vazgeç" }, { text: "Engelle", style:'destructive', onPress: async () => {
                  await userRef.update({ blockedUsers: firestore.FieldValue.arrayUnion(targetUserId) });
                  setIsBlocked(true); setOptionsVisible(false);
              }}]);
          }
      } catch (error) { alertError("Hata", "İşlem başarısız."); }
  };

  const handleReport = () => {
      alertWarning("Şikayet Et", "Sebep seçin:", [
          { text: "İptal", style: "cancel" },
          { text: "Spam", onPress: () => sendReport("Spam") },
          { text: "Hakaret", onPress: () => sendReport("Hakaret") },
      ]);
  };

  const sendReport = async (reason) => {
      try {
          await firestore().collection('reports').add({ reporterId: user.uid, targetUserId, reason, createdAt: firestore.FieldValue.serverTimestamp() });
          alertSuccess("Teşekkürler", "Şikayet alındı."); setOptionsVisible(false);
      } catch (e) { alertError("Hata", "Gönderilemedi."); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    if (!result.canceled) { handleSend(null, result.assets[0].uri); }
  };

  const uploadImage = async (uri) => {
    try {
        const filename = `chats/${conversationId}/${Date.now()}.jpg`;
        const storageRef = storage().ref(filename);
        await storageRef.putFile(uri);
        return await storageRef.getDownloadURL();
    } catch (error) {
        console.error("Chat fotoğraf yükleme hatası:", error);
        return null;
    }
  };

  const handleSend = async (text, imageUri = null) => {
    if ((!text && !imageUri) || !targetUserId) return;
    
    setUploading(true);
    let imageUrl = null;
    try {
        if (imageUri) { imageUrl = await uploadImage(imageUri); }
        
        const senderName = userProfile?.name || userProfile?.fullname || user.email;

        const messageData = {
            text: text || '',
            image: imageUrl,
            senderId: user.uid,
            senderEmail: user.email || '',
            receiverId: targetUserId,
            createdAt: firestore.FieldValue.serverTimestamp(),
            jobId: jobId || null,
            read: false
        };
        const messagesRef = firestore().collection('conversations').doc(conversationId).collection('messages');
        await messagesRef.add(messageData);

        const convRef = firestore().collection('conversations').doc(conversationId);
        await convRef.set({
            participants: [user.uid, targetUserId],
            lastMessage: text || 'Fotoğraf 📷',
            lastMessageDate: firestore.FieldValue.serverTimestamp(),
            jobId: jobId || null,
            [`unreadCounts.${targetUserId}`]: firestore.FieldValue.increment(1)
        }, { merge: true });

        if (targetUserId) {
            const userDoc = await firestore().collection('users').doc(targetUserId).get();
            if (userDoc.exists) {
                const targetData = userDoc.data();
                
                if (targetData.pushToken) {
                    await sendPushNotification(
                        targetData.pushToken,
                        "Yeni Mesajın Var 💬", 
                        text ? text : 'Fotoğraf gönderildi 📷',
                        { type: 'CHAT', senderId: user.uid, jobId: jobId }
                    );
                }

                const targetRole = currentUserRole === 'customer' ? 'pro' : 'customer';

                await sendNotification({
                    text: `Yeni mesaj: ${text || 'Fotoğraf'}`,
                    targetUserId: targetUserId,
                    targetRole: targetRole,
                    data: { 
                        type: 'CHAT', 
                        targetUserId: user.uid,
                        ustaName: senderName 
                    }
                });
            }
        }
        setInputText('');
    } catch (error) { 
        console.error(error);
        alertError("Hata", "Mesaj gönderilemedi."); 
    } finally { 
        setUploading(false); 
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.uid;
    let timeString = '';
    if (item.createdAt && item.createdAt.toDate) {
        timeString = item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
      <View style={[styles.messageRow, isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        {!isMe && (<View style={styles.avatar}><Ionicons name="person" size={16} color="white" /></View>)}
        <View style={[styles.bubble, isMe ? { backgroundColor: COLORS.primary, borderBottomRightRadius: 0 } : { backgroundColor: theme.card, borderBottomLeftRadius: 0, borderWidth:1, borderColor: theme.border }]}>
          {item.image && (
              <TouchableOpacity onPress={() => { setSelectedImage(item.image); setModalVisible(true); }}>
                  <Image source={{ uri: item.image }} style={{ width: 200, height: 150, borderRadius: 10, marginBottom: 5 }} resizeMode="cover" />
              </TouchableOpacity>
          )}
          {item.text ? <Text style={[styles.msgText, isMe ? {color:'white'} : {color: theme.text}]}>{item.text}</Text> : null}
          
          <View style={{flexDirection:'row', alignItems:'center', alignSelf:'flex-end', marginTop:4}}>
             <Text style={[styles.timeText, isMe ? {color:'rgba(255,255,255,0.7)'} : {color: theme.subText}]}>{timeString}</Text>
             {isMe && (
                 <Ionicons name={item.read ? "checkmark-done-outline" : "checkmark-outline"} size={14} color="white" style={{marginLeft:4}} />
             )}
          </View>
        </View>
      </View>
    );
  };

  if (!user) {
      return (
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
              <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
      );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.statusBar} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      <View style={[styles.header, {backgroundColor: theme.card, borderBottomColor: theme.border}]}>
         <View style={{flexDirection:'row', alignItems:'center'}}>
             <TouchableOpacity onPress={() => navigation.goBack()} style={{padding:5, marginRight:10}}>
                 <Ionicons name="arrow-back" size={24} color={theme.text} />
             </TouchableOpacity>
             
             {/* ✅ [9] İSME TIKLANINCA PROFILE GİT */}
             <TouchableOpacity onPress={() => {
                 if (targetUserId) {
                     navigation.navigate('ProDetail', { proId: targetUserId });
                 }
             }}>
                 <Text style={[styles.headerTitle, {color: theme.text, textDecorationLine: 'underline'}]}>
                     {ustaName || 'Sohbet'}
                 </Text>
             </TouchableOpacity>
         </View>
         <TouchableOpacity onPress={() => setOptionsVisible(true)}>
             <Ionicons name="ellipsis-vertical" size={24} color={theme.text} />
         </TouchableOpacity>
      </View>

      <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isChatDisabled ? (
          <View style={{padding:20, alignItems:'center', backgroundColor: theme.card}}>
              <Text style={{color: theme.subText}}>Bu iş tamamlandığı için sohbet kapalı.</Text>
          </View>
      ) : isBlocked ? (
          <View style={styles.blockedContainer}>
              <Text style={{color:'red'}}>Bu kullanıcı engelli. Mesaj atamazsınız.</Text>
          </View>
      ) : (
          <View style={[styles.inputContainer, {backgroundColor: theme.card, borderTopColor: theme.border}]}>
              <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
                  <Ionicons name="image-outline" size={28} color={COLORS.primary} />
              </TouchableOpacity>
              <TextInput
                  style={[styles.input, {backgroundColor: theme.input, color: theme.text}]}
                  placeholder="Mesaj yaz..."
                  placeholderTextColor={theme.subText}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
              />
              <TouchableOpacity onPress={() => handleSend(inputText)} style={styles.sendButton} disabled={uploading}>
                  {uploading ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="send" size={20} color="white" />}
              </TouchableOpacity>
          </View>
      )}
      </KeyboardAvoidingView>

      <Modal visible={optionsVisible} transparent={true} animationType="fade">
          <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => setOptionsVisible(false)}>
              <View style={[styles.optionsMenu, {backgroundColor: theme.card}]}>
                  <TouchableOpacity style={styles.optionItem} onPress={handleBlockToggle}>
                      <Text style={[styles.optionText, {color: isBlocked ? 'green' : 'red'}]}>
                          {isBlocked ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'}
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
                      <Text style={[styles.optionText, {color: theme.text}]}>Şikayet Et</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>

      <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={40} color="white" />
              </TouchableOpacity>
              {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />}
          </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, elevation: 2, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  messageRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ccc', justifyContent:'center', alignItems:'center', marginRight: 8 },
  bubble: { padding: 12, borderRadius: 16, maxWidth: '75%' },
  msgText: { fontSize: 15 },
  timeText: { fontSize: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 20 : 10 },
  blockedContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, borderTopWidth: 1, justifyContent:'center' },
  iconButton: { marginRight: 10, padding: 5 },
  input: { flex: 1, padding: 10, borderRadius: 20, maxHeight: 100 },
  sendButton: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  modalContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '90%' },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  optionsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  optionsMenu: { width: '70%', borderRadius: 12, padding: 10, elevation: 5 },
  optionItem: { paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  optionText: { fontSize: 16, fontWeight: '500' },
});