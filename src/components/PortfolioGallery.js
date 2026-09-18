// =====================================================
// 📸 USTA PORTFÖY GALERİSİ BİLEŞENİ
// =====================================================
// Kullanım: ProProfileScreen ve ProDetailScreen'de
// =====================================================

import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 60) / 3; // 3 sütun, 20px padding

// =====================================================
// 1. PORTFÖY GALERİSİ (Görüntüleme - ProDetailScreen için)
// =====================================================
export function PortfolioGallery({ images = [], theme }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: theme.input }]}>
                <Ionicons name="images-outline" size={40} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                    Henüz portföy fotoğrafı eklenmemiş
                </Text>
            </View>
        );
    }

    const openImage = (image, index) => {
        setSelectedImage(image);
        setCurrentIndex(index);
        setModalVisible(true);
    };

    const goToNext = () => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedImage(images[currentIndex + 1]);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setSelectedImage(images[currentIndex - 1]);
        }
    };

    return (
        <View style={styles.galleryContainer}>
            <FlatList
                data={images}
                numColumns={3}
                keyExtractor={(item, index) => `portfolio-${index}`}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        style={styles.imageWrapper}
                        onPress={() => openImage(item, index)}
                    >
                        <Image source={{ uri: item.url }} style={styles.thumbnailImage} />
                        {item.description && (
                            <View style={styles.imageOverlay}>
                                <Ionicons name="chatbubble" size={12} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            />

            {/* Tam Ekran Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Kapat Butonu */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <Ionicons name="close-circle" size={40} color="white" />
                    </TouchableOpacity>

                    {/* Önceki Butonu */}
                    {currentIndex > 0 && (
                        <TouchableOpacity style={styles.navButtonLeft} onPress={goToPrev}>
                            <Ionicons name="chevron-back" size={40} color="white" />
                        </TouchableOpacity>
                    )}

                    {/* Görsel */}
                    {selectedImage && (
                        <View style={styles.fullImageContainer}>
                            <Image
                                source={{ uri: selectedImage.url }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                            {selectedImage.description && (
                                <View style={styles.descriptionBox}>
                                    <Text style={styles.descriptionText}>
                                        {selectedImage.description}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Sonraki Butonu */}
                    {currentIndex < images.length - 1 && (
                        <TouchableOpacity style={styles.navButtonRight} onPress={goToNext}>
                            <Ionicons name="chevron-forward" size={40} color="white" />
                        </TouchableOpacity>
                    )}

                    {/* Sayfa Göstergesi */}
                    <View style={styles.pagination}>
                        <Text style={styles.paginationText}>
                            {currentIndex + 1} / {images.length}
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// =====================================================
// 2. PORTFÖY YÖNETİCİSİ (Düzenleme - ProProfileScreen için)
// =====================================================
export function PortfolioManager({ userId, images = [], onUpdate, theme, maxImages = 9, alertWarning, alertSuccess, alertError }) {
    const [uploading, setUploading] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedForDelete, setSelectedForDelete] = useState(null);

    // Fotoğraf Seçme
    const pickImage = async () => {
        if (images.length >= maxImages) {
            if (alertWarning) alertWarning('Limit', `En fazla ${maxImages} fotoğraf ekleyebilirsiniz.`);
            return;
        }

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            if (alertWarning) alertWarning('İzin Gerekli', 'Galeriye erişim izni vermelisiniz.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            // Android'de prompt olmadığı için doğrudan yükle
            await uploadImage(result.assets[0].uri, '');
        }
    };

    // Android için alternatif (Alert.prompt Android'de çalışmaz)
    const pickImageAndroid = async () => {
        if (images.length >= maxImages) {
            if (alertWarning) alertWarning('Limit', `En fazla ${maxImages} fotoğraf ekleyebilirsiniz.`);
            return;
        }

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            if (alertWarning) alertWarning('İzin Gerekli', 'Galeriye erişim izni vermelisiniz.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadImage(result.assets[0].uri, '');
        }
    };

    // Fotoğraf Yükleme
    const uploadImage = async (uri, description) => {
        setUploading(true);
        try {
            const filename = `portfolio_${Date.now()}.jpg`;
            const storageRef = storage().ref(`portfolios/${userId}/${filename}`);

            await storageRef.putFile(uri);
            const downloadURL = await storageRef.getDownloadURL();

            const newImage = {
                url: downloadURL,
                description: description,
                filename: filename,
                createdAt: new Date().toISOString()
            };

            // Firestore'a ekle
            await firestore().collection('users').doc(userId).update({
                portfolio: firestore.FieldValue.arrayUnion(newImage)
            });

            // Local state güncelle
            if (onUpdate) {
                onUpdate([...images, newImage]);
            }

            if (alertSuccess) alertSuccess('Başarılı', 'Fotoğraf portföyünüze eklendi!');
        } catch (error) {
            console.error('Upload hatası:', error);
            if (alertError) alertError('Hata', 'Fotoğraf yüklenemedi. Tekrar deneyin.');
        } finally {
            setUploading(false);
        }
    };

    // Fotoğraf Silme
    const deleteImage = async () => {
        if (!selectedForDelete) return;

        try {
            // Storage'dan sil
            const storageRef = storage().ref(`portfolios/${userId}/${selectedForDelete.filename}`);
            await storageRef.delete().catch(() => {
                // Dosya bulunamazsa devam et
            });

            // Firestore'dan sil
            await firestore().collection('users').doc(userId).update({
                portfolio: firestore.FieldValue.arrayRemove(selectedForDelete)
            });

            // Local state güncelle
            if (onUpdate) {
                onUpdate(images.filter(img => img.url !== selectedForDelete.url));
            }

            if (alertSuccess) alertSuccess('Silindi', 'Fotoğraf portföyünüzden kaldırıldı.');
        } catch (error) {
            console.error('Silme hatası:', error);
            if (alertError) alertError('Hata', 'Fotoğraf silinemedi.');
        } finally {
            setDeleteModalVisible(false);
            setSelectedForDelete(null);
        }
    };

    const confirmDelete = (image) => {
        setSelectedForDelete(image);
        setDeleteModalVisible(true);
    };

    return (
        <View style={styles.managerContainer}>
            {/* Başlık ve Ekle Butonu */}
            <View style={styles.managerHeader}>
                <Text style={[styles.managerTitle, { color: theme.text }]}>
                    Portföyüm ({images.length}/{maxImages})
                </Text>
                <TouchableOpacity
                    style={[styles.addButton, uploading && styles.addButtonDisabled]}
                    onPress={Platform.OS === 'ios' ? pickImage : pickImageAndroid}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Ionicons name="add" size={20} color="white" />
                            <Text style={styles.addButtonText}>Ekle</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={[styles.managerSubtitle, { color: theme.subText }]}>
                Yaptığınız işlerden fotoğraflar ekleyin, müşteriler güvensin!
            </Text>

            {/* Fotoğraf Grid */}
            {images.length === 0 ? (
                <TouchableOpacity
                    style={[styles.emptyAddBox, { borderColor: theme.border }]}
                    onPress={Platform.OS === 'ios' ? pickImage : pickImageAndroid}
                    disabled={uploading}
                >
                    <Ionicons name="camera-outline" size={40} color={theme.subText} />
                    <Text style={[styles.emptyAddText, { color: theme.subText }]}>
                        İlk fotoğrafınızı ekleyin
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.gridContainer}>
                    {images.map((image, index) => (
                        <View key={`edit-${index}`} style={styles.editImageWrapper}>
                            <Image source={{ uri: image.url }} style={styles.editThumbnail} />
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => confirmDelete(image)}
                            >
                                <Ionicons name="close-circle" size={24} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Ekle Kutusu (Limit dolmadıysa) */}
                    {images.length < maxImages && (
                        <TouchableOpacity
                            style={[styles.addImageBox, { borderColor: theme.border }]}
                            onPress={Platform.OS === 'ios' ? pickImage : pickImageAndroid}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <Ionicons name="add" size={30} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Silme Onay Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.deleteModalOverlay}>
                    <View style={[styles.deleteModalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.deleteModalTitle, { color: theme.text }]}>
                            Fotoğrafı Sil
                        </Text>
                        <Text style={[styles.deleteModalText, { color: theme.subText }]}>
                            Bu fotoğrafı portföyünüzden silmek istediğinize emin misiniz?
                        </Text>
                        <View style={styles.deleteModalButtons}>
                            <TouchableOpacity
                                style={[styles.deleteModalBtn, styles.cancelBtn]}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.deleteModalBtn, styles.confirmDeleteBtn]}
                                onPress={deleteImage}
                            >
                                <Text style={styles.confirmDeleteBtnText}>Sil</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Platform import for pickImage logic
import { Platform } from 'react-native';

const styles = StyleSheet.create({
    // Galeri Stilleri
    galleryContainer: {
        marginTop: 10,
    },
    emptyContainer: {
        padding: 30,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
        textAlign: 'center',
    },
    imageWrapper: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        margin: 5,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        padding: 3,
    },

    // Modal Stilleri
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    navButtonLeft: {
        position: 'absolute',
        left: 10,
        zIndex: 10,
        padding: 10,
    },
    navButtonRight: {
        position: 'absolute',
        right: 10,
        zIndex: 10,
        padding: 10,
    },
    fullImageContainer: {
        width: '100%',
        alignItems: 'center',
    },
    fullImage: {
        width: width - 40,
        height: width - 40,
    },
    descriptionBox: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
        maxWidth: width - 60,
    },
    descriptionText: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
    },
    pagination: {
        position: 'absolute',
        bottom: 50,
    },
    paginationText: {
        color: 'white',
        fontSize: 16,
    },

    // Manager Stilleri
    managerContainer: {
        marginVertical: 10,
    },
    managerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    managerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    managerSubtitle: {
        fontSize: 12,
        marginBottom: 15,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addButtonDisabled: {
        opacity: 0.6,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    editImageWrapper: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        margin: 5,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    editThumbnail: {
        width: '100%',
        height: '100%',
    },
    deleteButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    addImageBox: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        margin: 5,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyAddBox: {
        padding: 40,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyAddText: {
        marginTop: 10,
        fontSize: 14,
    },

    // Delete Modal
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteModalContent: {
        width: '80%',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    deleteModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    deleteModalText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    deleteModalButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    deleteModalBtn: {
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 10,
    },
    cancelBtn: {
        backgroundColor: '#e5e7eb',
    },
    cancelBtnText: {
        color: '#374151',
        fontWeight: '600',
    },
    confirmDeleteBtn: {
        backgroundColor: '#ef4444',
    },
    confirmDeleteBtnText: {
        color: 'white',
        fontWeight: '600',
    },
});
