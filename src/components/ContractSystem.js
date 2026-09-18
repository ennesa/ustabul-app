// =====================================================
// 📄 DİJİTAL SÖZLEŞME SİSTEMİ
// =====================================================
// Müşteri ve Usta arasında dijital anlaşma belgesi
// =====================================================

import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS } from '../constants/colors';

// =====================================================
// 1. SÖZLEŞME GÖRÜNTÜLEME BİLEŞENİ
// =====================================================
export function ContractView({ contract, theme }) {
    if (!contract) {
        return (
            <View style={[styles.emptyContract, { backgroundColor: theme.input }]}>
                <Ionicons name="document-outline" size={40} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                    Henüz sözleşme oluşturulmamış
                </Text>
            </View>
        );
    }

    const statusColors = {
        'pending': { bg: '#fef3c7', text: '#92400e', label: 'Onay Bekliyor' },
        'accepted': { bg: '#d1fae5', text: '#065f46', label: 'Onaylandı' },
        'rejected': { bg: '#fee2e2', text: '#991b1b', label: 'Reddedildi' },
        'completed': { bg: '#dbeafe', text: '#1e40af', label: 'Tamamlandı' }
    };

    const status = statusColors[contract.status] || statusColors.pending;

    return (
        <View style={[styles.contractCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.contractHeader}>
                <View style={styles.contractIcon}>
                    <Ionicons name="document-text" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.contractHeaderText}>
                    <Text style={[styles.contractTitle, { color: theme.text }]}>
                        İş Anlaşması
                    </Text>
                    <Text style={[styles.contractId, { color: theme.subText }]}>
                        #{contract.contractId || 'N/A'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>
                        {status.label}
                    </Text>
                </View>
            </View>

            <View style={styles.contractDetails}>
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.subText }]}>Hizmet:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                        {contract.serviceName}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.subText }]}>Anlaşılan Fiyat:</Text>
                    <Text style={[styles.detailValue, styles.priceValue]}>
                        {contract.agreedPrice} ₺
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.subText }]}>Tarih:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                        {contract.createdAt ? new Date(contract.createdAt.toDate()).toLocaleDateString('tr-TR') : '-'}
                    </Text>
                </View>
            </View>

            {contract.terms && (
                <View style={[styles.termsBox, { backgroundColor: theme.input }]}>
                    <Text style={[styles.termsTitle, { color: theme.text }]}>Anlaşma Şartları:</Text>
                    <Text style={[styles.termsText, { color: theme.subText }]}>
                        {contract.terms}
                    </Text>
                </View>
            )}
        </View>
    );
}

// =====================================================
// 2. SÖZLEŞME OLUŞTURMA MODAL
// =====================================================
export function ContractModal({
    visible,
    onClose,
    jobData,
    offerData,
    customerData,
    proData,
    onAccept,
    theme,
    alertSuccess,
    alertError,
    alertWarning
}) {
    const [loading, setLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const generateContractId = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `UST-${timestamp}-${random}`;
    };

    const handleAccept = async () => {
        if (!accepted) {
            if (alertWarning) alertWarning('Uyarı', 'Devam etmek için şartları kabul etmelisiniz.');
            return;
        }

        setLoading(true);
        try {
            const contractId = generateContractId();
            
            const contractData = {
                contractId,
                jobId: jobData.id,
                serviceName: jobData.serviceName || jobData.category,
                serviceDescription: jobData.description,
                
                customerId: customerData.id,
                customerName: customerData.name,
                customerPhone: customerData.phone || '',
                
                proId: proData.id,
                proName: proData.name,
                proPhone: proData.phone || '',
                
                agreedPrice: offerData.price,
                originalBudget: jobData.budget,
                
                terms: `
1. Usta, belirtilen hizmeti profesyonel standartlarda gerçekleştirmeyi taahhüt eder.
2. Müşteri, iş tamamlandığında anlaşılan ücreti ödemeyi kabul eder.
3. İş süresi ve detayları taraflar arasında ayrıca belirlenecektir.
4. Herhangi bir anlaşmazlık durumunda Ustabul arabuluculuk yapacaktır.
5. Bu sözleşme dijital ortamda kabul edilmiştir ve yasal geçerliliğe sahiptir.
                `.trim(),
                
                status: 'accepted',
                customerAcceptedAt: firestore.FieldValue.serverTimestamp(),
                createdAt: firestore.FieldValue.serverTimestamp(),
            };

            // Callback ile üst bileşene ilet
            if (onAccept) {
                await onAccept(contractData);
            }

            if (alertSuccess) alertSuccess('Başarılı', 'Sözleşme oluşturuldu! Usta ile iletişime geçebilirsiniz.');
            onClose();
        } catch (error) {
            console.error('Sözleşme hatası:', error);
            if (alertError) alertError('Hata', 'Sözleşme oluşturulamadı. Tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    if (!jobData || !offerData) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            İş Anlaşması
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {/* İş Bilgileri */}
                        <View style={[styles.infoSection, { backgroundColor: theme.input }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                📋 İş Detayları
                            </Text>
                            <Text style={[styles.infoText, { color: theme.subText }]}>
                                <Text style={{ fontWeight: 'bold' }}>Hizmet: </Text>
                                {jobData.serviceName || jobData.category}
                            </Text>
                            <Text style={[styles.infoText, { color: theme.subText }]}>
                                <Text style={{ fontWeight: 'bold' }}>Konum: </Text>
                                {jobData.district}, {jobData.city}
                            </Text>
                            <Text style={[styles.infoText, { color: theme.subText }]}>
                                <Text style={{ fontWeight: 'bold' }}>Açıklama: </Text>
                                {jobData.description}
                            </Text>
                        </View>

                        {/* Usta Bilgileri */}
                        <View style={[styles.infoSection, { backgroundColor: theme.input }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                👷 Usta Bilgileri
                            </Text>
                            <Text style={[styles.infoText, { color: theme.subText }]}>
                                <Text style={{ fontWeight: 'bold' }}>Ad Soyad: </Text>
                                {proData?.name || offerData.ustaName}
                            </Text>
                            {proData?.phone && (
                                <Text style={[styles.infoText, { color: theme.subText }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Telefon: </Text>
                                    {proData.phone}
                                </Text>
                            )}
                        </View>

                        {/* Fiyat */}
                        <View style={[styles.priceSection, { backgroundColor: '#dcfce7' }]}>
                            <Text style={styles.priceLabel}>Anlaşılan Fiyat</Text>
                            <Text style={styles.priceAmount}>{offerData.price} ₺</Text>
                        </View>

                        {/* Şartlar */}
                        <View style={[styles.termsSection, { borderColor: theme.border }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                📜 Anlaşma Şartları
                            </Text>
                            <Text style={[styles.termsContent, { color: theme.subText }]}>
                                1. Usta, belirtilen hizmeti profesyonel standartlarda gerçekleştirmeyi taahhüt eder.
                                {'\n\n'}
                                2. Müşteri, iş tamamlandığında anlaşılan ücreti ödemeyi kabul eder.
                                {'\n\n'}
                                3. İş süresi ve detayları taraflar arasında ayrıca belirlenecektir.
                                {'\n\n'}
                                4. Herhangi bir anlaşmazlık durumunda Ustabul arabuluculuk yapacaktır.
                                {'\n\n'}
                                5. Bu sözleşme dijital ortamda kabul edilmiştir.
                            </Text>
                        </View>

                        {/* Onay Checkbox */}
                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setAccepted(!accepted)}
                        >
                            <View style={[
                                styles.checkbox,
                                accepted && styles.checkboxChecked
                            ]}>
                                {accepted && (
                                    <Ionicons name="checkmark" size={16} color="white" />
                                )}
                            </View>
                            <Text style={[styles.checkboxText, { color: theme.text }]}>
                                Yukarıdaki şartları okudum ve kabul ediyorum.
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.footerBtn, styles.cancelBtn]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelBtnText}>Vazgeç</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.footerBtn, 
                                styles.acceptBtn,
                                (!accepted || loading) && styles.disabledBtn
                            ]}
                            onPress={handleAccept}
                            disabled={!accepted || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.acceptBtnText}>Onayla ve Kabul Et</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// =====================================================
// 3. PDF OLUŞTURMA VE PAYLAŞMA
// =====================================================
export async function generateContractPDF(contract) {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .header { text-align: center; border-bottom: 2px solid #007AFF; padding-bottom: 20px; }
                .logo { font-size: 28px; font-weight: bold; color: #007AFF; }
                .contract-id { color: #666; margin-top: 10px; }
                .section { margin: 25px 0; }
                .section-title { font-size: 16px; font-weight: bold; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .info-row { display: flex; margin: 10px 0; }
                .info-label { font-weight: bold; width: 150px; color: #555; }
                .info-value { color: #333; }
                .price-box { background: #dcfce7; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
                .price-amount { font-size: 32px; font-weight: bold; color: #16a34a; }
                .terms { background: #f8fafc; padding: 15px; border-radius: 8px; line-height: 1.8; }
                .signature-area { margin-top: 40px; display: flex; justify-content: space-between; }
                .signature-box { width: 45%; text-align: center; }
                .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 10px; }
                .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">USTABUL</div>
                <div>İş Anlaşma Belgesi</div>
                <div class="contract-id">Sözleşme No: ${contract.contractId}</div>
            </div>
            
            <div class="section">
                <div class="section-title">İş Bilgileri</div>
                <div class="info-row">
                    <span class="info-label">Hizmet:</span>
                    <span class="info-value">${contract.serviceName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Açıklama:</span>
                    <span class="info-value">${contract.serviceDescription || '-'}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Taraflar</div>
                <div class="info-row">
                    <span class="info-label">Müşteri:</span>
                    <span class="info-value">${contract.customerName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Usta:</span>
                    <span class="info-value">${contract.proName}</span>
                </div>
            </div>
            
            <div class="price-box">
                <div>Anlaşılan Fiyat</div>
                <div class="price-amount">${contract.agreedPrice} ₺</div>
            </div>
            
            <div class="section">
                <div class="section-title">Anlaşma Şartları</div>
                <div class="terms">${contract.terms.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="signature-area">
                <div class="signature-box">
                    <div class="signature-line">Müşteri İmzası</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Usta İmzası</div>
                </div>
            </div>
            
            <div class="footer">
                Bu belge Ustabul uygulaması üzerinden dijital olarak oluşturulmuştur.<br>
                Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}
            </div>
        </body>
        </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Sözleşmeyi Paylaş'
            });
        }
        
        return uri;
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        // Alert kaldırıldı - çağıran component hata yönetimini yapacak
        return null;
    }
}

const styles = StyleSheet.create({
    // Contract View Styles
    emptyContract: {
        padding: 30,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
    },
    contractCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    contractHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    contractIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e0f2fe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contractHeaderText: {
        flex: 1,
        marginLeft: 12,
    },
    contractTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    contractId: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    contractDetails: {
        padding: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    priceValue: {
        color: '#16a34a',
        fontSize: 16,
    },
    termsBox: {
        margin: 15,
        marginTop: 0,
        padding: 12,
        borderRadius: 8,
    },
    termsTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    termsText: {
        fontSize: 13,
        lineHeight: 20,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '90%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalBody: {
        flex: 1,
        padding: 20,
    },
    infoSection: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 22,
    },
    priceSection: {
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
    },
    priceLabel: {
        fontSize: 14,
        color: '#065f46',
    },
    priceAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#16a34a',
        marginTop: 5,
    },
    termsSection: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    termsContent: {
        fontSize: 13,
        lineHeight: 22,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
    },
    checkboxText: {
        flex: 1,
        fontSize: 14,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#e5e7eb',
    },
    cancelBtnText: {
        color: '#374151',
        fontWeight: '600',
    },
    acceptBtn: {
        backgroundColor: COLORS.primary,
    },
    acceptBtnText: {
        color: 'white',
        fontWeight: '600',
    },
    disabledBtn: {
        opacity: 0.5,
    },
});
