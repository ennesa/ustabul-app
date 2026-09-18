// src/utils/chatHelper.js

export const getConversationId = (currentUserId, targetUserId) => {
  // ID'leri alfabetik sıraya koyup birleştiriyoruz. 
  // Böylece kim mesaj atarsa atsın Sohbet ID'si hep aynı olur (örn: "user123_user456")
  const sortedIds = [currentUserId, targetUserId].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};