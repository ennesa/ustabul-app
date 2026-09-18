import { Ionicons } from "@expo/vector-icons";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../constants/colors";
import { useUI } from "../context/UIContext";

const KVKKSettingsScreen = ({ navigation }) => {
  const { alertSuccess, alertError, alertWarning, alertInfo } = useUI();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [selectedRequestType, setSelectedRequestType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDoc = await firestore().collection("users").doc(auth().currentUser.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        setUserData(data);
        setMarketingConsent(
          data.kvkkConsents?.marketingConsent?.accepted || false,
        );
      }
    } catch (error) {
      console.error("Kullanıcı verisi yüklenirken hata:", error);
      alertError("Hata", "Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMarketingConsent = async () => {
    try {
      const newValue = !marketingConsent;

      await firestore().collection("users").doc(auth().currentUser.uid).update({
        "kvkkConsents.marketingConsent": {
          accepted: newValue,
          acceptedAt: newValue ? firestore.FieldValue.serverTimestamp() : null,
          revokedAt: !newValue ? firestore.FieldValue.serverTimestamp() : null,
        },
      });

      setMarketingConsent(newValue);

      alertSuccess(
        "Başarılı",
        newValue
          ? "Pazarlama bildirimleri açıldı."
          : "Pazarlama bildirimleri kapatıldı.",
      );
    } catch (error) {
      console.error("Pazarlama onayı güncellenirken hata:", error);
      alertError("Hata", "İşlem sırasında bir hata oluştu.");
    }
  };

  const requestTypes = [
    {
      id: "info",
      title: "Bilgi Talep Etme",
      description: "Hangi verilerimin işlendiğini öğrenmek istiyorum",
      icon: "information-circle",
    },
    {
      id: "correction",
      title: "Düzeltme Talebi",
      description: "Yanlış/eksik verilerimin düzeltilmesini istiyorum",
      icon: "create",
    },
    {
      id: "deletion",
      title: "Silme Talebi",
      description: "Verilerimin silinmesini istiyorum",
      icon: "trash",
    },
    {
      id: "objection",
      title: "İtiraz",
      description: "Veri işlemeye itiraz etmek istiyorum",
      icon: "hand-left",
    },
    {
      id: "portability",
      title: "Veri Taşınabilirliği",
      description: "Verilerimi almak istiyorum",
      icon: "download",
    },
    {
      id: "other",
      title: "Diğer",
      description: "Farklı bir talebim var",
      icon: "ellipsis-horizontal",
    },
  ];

  const submitKVKKRequest = async () => {
    if (!selectedRequestType) {
      alertWarning("Uyarı", "Lütfen bir talep türü seçin.");
      return;
    }

    if (!requestText.trim()) {
      alertWarning("Uyarı", "Lütfen talebinizi açıklayın.");
      return;
    }

    setSubmitting(true);

    try {
      await firestore().collection("kvkkRequests").add({
        userId: auth().currentUser.uid,
        userName: userData.fullName || userData.name,
        userEmail: userData.email,
        userPhone: userData.phone,
        requestType: selectedRequestType,
        requestText: requestText.trim(),
        status: "pending",
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      alertSuccess(
        "Başarılı",
        "KVKK talebiniz alındı. 30 gün içinde size dönüş yapılacaktır.",
        [
          {
            text: "Tamam",
            onPress: () => {
              setSelectedRequestType(null);
              setRequestText("");
            },
          },
        ],
      );
    } catch (error) {
      console.error("KVKK talebi gönderilirken hata:", error);
      alertSuccess(
        "Hata",
        "Talep gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const downloadMyData = async () => {
    alertSuccess(
      "Veri İndirme",
      "Verileriniz hazırlanacak ve e-posta adresinize gönderilecektir. Bu işlem birkaç gün sürebilir.",
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Onayla",
          onPress: async () => {
            try {
              await firestore().collection("kvkkRequests").add({
                userId: auth().currentUser.uid,
                userName: userData.fullName || userData.name,
                userEmail: userData.email,
                requestType: "data_download",
                requestText:
                  "Kullanıcı tüm verilerinin indirilmesini talep etti.",
                status: "pending",
                createdAt: firestore.FieldValue.serverTimestamp(),
              });

              alertSuccess(
                "Talep Alındı",
                "Verileriniz hazırlandığında " +
                  userData.email +
                  " adresine gönderilecektir.",
              );
            } catch (error) {
              console.error("Veri indirme talebi hatası:", error);
              alertError("Hata", "Talep oluşturulamadı.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KVKK Ayarları</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Onay Durumu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onay Durumunuz</Text>

          <View style={styles.consentItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.consentTitle}>Gizlilik Politikası</Text>
              <Text style={styles.consentDate}>
                Kabul edildi:{" "}
                {userData?.kvkkConsents?.privacyPolicy?.acceptedAt
                  ? new Date(
                      userData.kvkkConsents.privacyPolicy.acceptedAt.seconds *
                        1000,
                    ).toLocaleDateString("tr-TR")
                  : "Bilinmiyor"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Legal", { type: "privacy" })}
            >
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.consentItem}>
            <Ionicons name="document-text" size={20} color="#4CAF50" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.consentTitle}>Kullanım Koşulları</Text>
              <Text style={styles.consentDate}>
                Kabul edildi:{" "}
                {userData?.kvkkConsents?.termsOfUse?.acceptedAt
                  ? new Date(
                      userData.kvkkConsents.termsOfUse.acceptedAt.seconds *
                        1000,
                    ).toLocaleDateString("tr-TR")
                  : "Bilinmiyor"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Legal", { type: "terms" })}
            >
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.consentItem}>
            <Ionicons
              name="notifications"
              size={20}
              color={marketingConsent ? "#4CAF50" : "#999"}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.consentTitle}>Pazarlama Bildirimleri</Text>
              <Text style={styles.consentDate}>
                {marketingConsent ? "Aktif" : "Kapalı"}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleMarketingConsent}>
              <View
                style={[styles.switch, marketingConsent && styles.switchActive]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    marketingConsent && styles.switchThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* KVKK Haklarınız */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KVKK Haklarınız</Text>
          <Text style={styles.sectionDescription}>
            6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:
          </Text>

          <View style={styles.rightsContainer}>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.rightText}>
                Verilerinizin işlenip işlenmediğini öğrenme
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.rightText}>İşlenmişse bilgi talep etme</Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.rightText}>İşlenme amacını öğrenme</Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.rightText}>
                Yurt içi/dışı aktarım bilgisi alma
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.rightText}>Düzeltme talep etme</Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.rightText}>Silme/yok etme talep etme</Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.rightText}>İtiraz etme</Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.rightText}>
                Zarar durumunda tazminat talep etme
              </Text>
            </View>
          </View>
        </View>

        {/* KVKK Başvurusu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KVKK Başvurusu Yap</Text>
          <Text style={styles.sectionDescription}>
            Haklarınızı kullanmak için aşağıdan talep türünü seçip başvuru
            yapabilirsiniz.
          </Text>

          <View style={styles.requestTypeContainer}>
            {requestTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.requestTypeCard,
                  selectedRequestType === type.id &&
                    styles.requestTypeCardActive,
                ]}
                onPress={() => setSelectedRequestType(type.id)}
              >
                <Ionicons
                  name={type.icon}
                  size={24}
                  color={
                    selectedRequestType === type.id ? COLORS.primary : "#666"
                  }
                />
                <Text
                  style={[
                    styles.requestTypeTitle,
                    selectedRequestType === type.id &&
                      styles.requestTypeTitleActive,
                  ]}
                >
                  {type.title}
                </Text>
                <Text style={styles.requestTypeDescription}>
                  {type.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedRequestType && (
            <View style={styles.requestFormContainer}>
              <Text style={styles.requestFormLabel}>
                Talebinizi Açıklayın *
              </Text>
              <TextInput
                style={styles.requestFormInput}
                placeholder="Talebinizi detaylı olarak yazınız..."
                value={requestText}
                onChangeText={setRequestText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={submitKVKKRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Başvuru Gönder</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.submitInfo}>
                Başvurunuz 30 gün içinde değerlendirilecek ve tarafınıza bilgi
                verilecektir.
              </Text>
            </View>
          )}
        </View>

        {/* Hızlı İşlemler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={downloadMyData}
          >
            <Ionicons name="download" size={20} color="#2196F3" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.actionButtonTitle}>Verilerimi İndir</Text>
              <Text style={styles.actionButtonDescription}>
                Tüm verilerinizi indirin
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Legal", { type: "privacy" })}
          >
            <Ionicons name="document-text" size={20} color="#4CAF50" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.actionButtonTitle}>Gizlilik Politikası</Text>
              <Text style={styles.actionButtonDescription}>
                Detaylı politikayı okuyun
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* İletişim */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KVKK İletişim</Text>
          <View style={styles.contactBox}>
            <Ionicons name="mail" size={20} color="#666" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.contactLabel}>E-posta</Text>
              <Text style={styles.contactValue}>kvkk@ustabul.com</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 16,
  },
  consentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  consentDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ccc",
    justifyContent: "center",
    padding: 2,
  },
  switchActive: {
    backgroundColor: "#4CAF50",
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  switchThumbActive: {
    alignSelf: "flex-end",
  },
  rightsContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  rightItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rightText: {
    fontSize: 13,
    color: "#333",
    marginLeft: 8,
  },
  requestTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  requestTypeCard: {
    width: "48%",
    margin: "1%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  requestTypeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#fff5f2",
  },
  requestTypeTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    textAlign: "center",
  },
  requestTypeTitleActive: {
    color: COLORS.primary,
  },
  requestTypeDescription: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  requestFormContainer: {
    marginTop: 16,
  },
  requestFormLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  requestFormInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#f8f9fa",
    minHeight: 100,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  submitInfo: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionButtonTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  actionButtonDescription: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  contactBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  contactLabel: {
    fontSize: 12,
    color: "#999",
  },
  contactValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginTop: 2,
  },
});

export default KVKKSettingsScreen;
