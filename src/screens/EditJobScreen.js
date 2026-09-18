import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { TURKEY_DATA } from '../constants/data';
import { useJobs } from '../context/JobContext';
import { useUI } from '../context/UIContext';
import { compressImage } from '../utils/imageHelper';

export default function EditJobScreen({ route, navigation }) {
    const job = route.params?.job;
    const { updateJob } = useJobs();
    const { theme, alertSuccess, alertError, alertWarning } = useUI();

    const safeTurkeyData = TURKEY_DATA || {};

    // Mevcut değerlerle doldur
    const [desc, setDesc] = useState(job?.description || job?.desc || '');
    const [city, setCity] = useState(job?.city || '');
    const [district, setDistrict] = useState(job?.district || '');
    const [neighborhood, setNeighborhood] = useState(job?.neighborhood || '');
    const [street, setStreet] = useState(job?.street || '');
    const [apartmentNo, setApartmentNo] = useState(job?.apartmentNo || '');

    // Fotoğraf yönetimi
    const [existingPhotos, setExistingPhotos] = useState(job?.jobPhotos || []);
    const [newPhotos, setNewPhotos] = useState([]);
    const [removedPhotoUrls, setRemovedPhotoUrls] = useState([]);

    // Modal ve loading
    const [modalVisible, setModalVisible] = useState(false);
    const [selectionType, setSelectionType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);

    const totalPhotoCount = existingPhotos.length + newPhotos.length;

    const removeExistingPhoto = (url) => {
        setExistingPhotos(prev => prev.filter(p => p !== url));
        setRemovedPhotoUrls(prev => [...prev, url]);
    };

    const removeNewPhoto = (index) => {
        setNewPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const pickImage = async () => {
        if (totalPhotoCount >= 3) {
            alertWarning("Sınır", "En fazla 3 fotoğraf ekleyebilirsiniz.");
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });
        if (!result.canceled) {
            const compressedUri = await compressImage(result.assets[0].uri, alertWarning);
            if (compressedUri) {
                setNewPhotos(prev => [...prev, compressedUri]);
            }
        }
    };

    const handleSave = async () => {
        if (!city || !district) {
            alertWarning("Eksik", "Lütfen şehir ve ilçe seçin.");
            return;
        }

        setSaving(true);
        try {
            const fullAddress = `${city}, ${district}, ${neighborhood}, ${street}, No: ${apartmentNo}`;
            const updatedFields = {
                description: desc,
                city,
                district,
                neighborhood,
                street,
                apartmentNo,
                address: fullAddress,
            };

            const result = await updateJob(job.id, updatedFields, newPhotos, removedPhotoUrls);
            if (result.success) {
                alertSuccess("Başarılı", "İlan güncellendi.");
                navigation.goBack();
            } else {
                alertError("Hata", result.error || "İlan güncellenemedi.");
            }
        } catch (e) {
            alertError("Hata", "Beklenmedik bir sorun oluştu.");
        } finally {
            setSaving(false);
        }
    };

    const getFilteredData = () => {
        let data = [];
        if (selectionType === 'CITY') data = Object.keys(safeTurkeyData);
        else if (selectionType === 'DISTRICT') data = safeTurkeyData[city] || [];
        if (searchTerm) return data.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
        return data;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBar} />

            {/* HEADER */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>İlanı Düzenle</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* KATEGORİ / HİZMET (Salt-okunur) */}
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <View style={styles.row}>
                            <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '15' }]}>
                                <Ionicons name="hammer" size={24} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.readOnlyLabel, { color: theme.subText }]}>Kategori / Hizmet</Text>
                                <Text style={[styles.readOnlyValue, { color: theme.text }]}>
                                    {job?.serviceName || job?.category || 'Hizmet'}
                                </Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                                <Text style={[styles.badgeText, { color: '#16a34a' }]}>Aktif</Text>
                            </View>
                        </View>
                    </View>

                    {/* AÇIKLAMA / NOT */}
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Açıklama / Not</Text>
                        <TextInput
                            style={[styles.input, styles.multilineInput, { backgroundColor: theme.input, color: theme.text }]}
                            placeholder="İlan açıklaması..."
                            placeholderTextColor={theme.subText}
                            multiline
                            value={desc}
                            onChangeText={setDesc}
                        />
                    </View>

                    {/* FOTOĞRAFLAR */}
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Fotoğraflar ({totalPhotoCount}/3)</Text>
                            {totalPhotoCount < 3 && (
                                <TouchableOpacity onPress={pickImage}>
                                    <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+ Ekle</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                            {existingPhotos.map((url, index) => (
                                <View key={`existing-${index}`}>
                                    <Image source={{ uri: url }} style={styles.photoThumb} />
                                    <TouchableOpacity style={styles.deleteBadge} onPress={() => removeExistingPhoto(url)}>
                                        <Ionicons name="close" size={10} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {newPhotos.map((uri, index) => (
                                <View key={`new-${index}`}>
                                    <Image source={{ uri }} style={[styles.photoThumb, { borderWidth: 2, borderColor: COLORS.primary }]} />
                                    <TouchableOpacity style={styles.deleteBadge} onPress={() => removeNewPhoto(index)}>
                                        <Ionicons name="close" size={10} color="white" />
                                    </TouchableOpacity>
                                    <View style={styles.newBadge}>
                                        <Text style={{ color: 'white', fontSize: 8, fontWeight: 'bold' }}>YENİ</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                        {totalPhotoCount === 0 && (
                            <Text style={{ color: theme.subText, fontSize: 13, marginTop: 5 }}>
                                Henüz fotoğraf eklenmemiş.
                            </Text>
                        )}
                    </View>

                    {/* KONUM VE ADRES */}
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Konum ve Adres</Text>

                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                            <TouchableOpacity
                                style={[styles.selectBox, { backgroundColor: theme.input }]}
                                onPress={() => { setSelectionType('CITY'); setSearchTerm(''); setModalVisible(true); }}
                            >
                                <Text style={{ color: city ? theme.text : theme.subText }}>{city || 'İl Seç'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.selectBox, { backgroundColor: theme.input }]}
                                onPress={() => {
                                    if (city) {
                                        setSelectionType('DISTRICT'); setSearchTerm(''); setModalVisible(true);
                                    } else {
                                        alertWarning("Bilgi", "Önce il seçin.");
                                    }
                                }}
                            >
                                <Text style={{ color: district ? theme.text : theme.subText }}>{district || 'İlçe Seç'}</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, color: theme.text, marginBottom: 10 }]}
                            placeholder="Mahalle"
                            placeholderTextColor={theme.subText}
                            value={neighborhood}
                            onChangeText={setNeighborhood}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TextInput
                                style={[styles.input, { flex: 2, backgroundColor: theme.input, color: theme.text }]}
                                placeholder="Cadde / Sokak"
                                placeholderTextColor={theme.subText}
                                value={street}
                                onChangeText={setStreet}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: theme.input, color: theme.text }]}
                                placeholder="No"
                                placeholderTextColor={theme.subText}
                                value={apartmentNo}
                                onChangeText={setApartmentNo}
                            />
                        </View>
                    </View>

                    {/* KAYDET BUTONU */}
                    <TouchableOpacity
                        style={[styles.saveButton, { opacity: saving ? 0.7 : 1 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={22} color="white" />
                                <Text style={styles.saveButtonText}>Kaydet</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* ŞEHİR/İLÇE SEÇİM MODALI */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={[styles.searchBox, { backgroundColor: theme.input }]}>
                            <Ionicons name="search" size={20} color={theme.subText} />
                            <TextInput
                                style={{ flex: 1, marginLeft: 10, color: theme.text }}
                                placeholder="Ara..."
                                placeholderTextColor={theme.subText}
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />
                        </View>
                        <FlatList
                            data={getFilteredData()}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={{ padding: 15, borderBottomWidth: 1, borderColor: theme.border }}
                                    onPress={() => {
                                        if (selectionType === 'CITY') { setCity(item); setDistrict(''); }
                                        else { setDistrict(item); }
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={{ color: theme.text }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={{ padding: 15, alignItems: 'center' }} onPress={() => setModalVisible(false)}>
                            <Text style={{ color: theme.subText }}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 5 },

    card: { padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    readOnlyLabel: { fontSize: 12, marginBottom: 2 },
    readOnlyValue: { fontSize: 16, fontWeight: 'bold' },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },

    input: { padding: 12, borderRadius: 10, fontSize: 15 },
    multilineInput: { height: 100, textAlignVertical: 'top' },

    photoThumb: { width: 70, height: 70, borderRadius: 8 },
    deleteBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    newBadge: { position: 'absolute', bottom: 2, left: 2, backgroundColor: COLORS.primary, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },

    selectBox: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },

    saveButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 30, elevation: 5, flexDirection: 'row', justifyContent: 'center', gap: 8 },
    saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%', padding: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 10 },
});
