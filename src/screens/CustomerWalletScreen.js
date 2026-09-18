// src/screens/CustomerWalletScreen.js
// =====================================================
// 💳 MÜŞTERİ CÜZDAN & BAKİYE YÜKLEME EKRANI
// =====================================================

import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { PRICING, formatPrice } from '../config/pricing';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export default function CustomerWalletScreen({ navigation }) {
    const { user, customerProfile, getBalance, addBalance } = useAuth();
    const { theme, alertInfo } = useUI();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [depositModalVisible, setDepositModalVisible] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [processing, setProcessing] = useState(false);

    // İşlem geçmişini çek
    const fetchTransactions = async () => {
        if (!user) return;

        try {
            const snapshot = await firestore()
                .collection('transactions')
                .where('userId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            const txList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(txList);
        } catch (error) {
            console.log("İşlem geçmişi çekilemedi:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    // Bakiye yükleme işlemi (şimdilik manuel - ileride Iyzico entegre edilecek)
    const handleDeposit = async () => {
        if (!selectedPackage) return;

        setProcessing(true);
        
        // ⚠️ ŞİMDİLİK: Manuel onay ile bakiye ekleniyor
        // İLERİDE: Iyzico entegrasyonu buraya gelecek
        
        alertInfo(
            "Ödeme Yöntemi",
            "Şu an için bakiye yükleme EFT/Havale ile yapılmaktadır.\n\nAçıklama kısmına kullanıcı kodunuzu yazın:\n" + user?.uid?.slice(0, 8),
            [
                { text: "Tamam", onPress: () => {
                    setDepositModalVisible(false);
                    setSelectedPackage(null);
                    alertInfo(
                        "Bilgi",
                        "Havale/EFT yaptıktan sonra bakiyeniz 1-24 saat içinde hesabınıza tanımlanacaktır."
                    );
                }}
            ]
        );

        setProcessing(false);
    };

    // İşlem kartı render
    const renderTransaction = ({ item }) => {
        const isDeposit = item.type === 'deposit';
        const date = item.createdAt?.toDate?.() 
            ? item.createdAt.toDate().toLocaleDateString('tr-TR', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : '-';

        return (
            <View style={[styles.txCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[
                    styles.txIcon, 
                    { backgroundColor: isDeposit ? '#dcfce7' : '#fee2e2' }
                ]}>
                    <Ionicons 
                        name={isDeposit ? "arrow-down" : "arrow-up"} 
                        size={20} 
                        color={isDeposit ? '#16a34a' : '#ef4444'} 
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: '600', color: theme.text }}>
                        {item.description || (isDeposit ? 'Bakiye Yükleme' : 'Harcama')}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>
                        {date}
                    </Text>
                </View>
                <Text style={{ 
                    fontWeight: 'bold', 
                    fontSize: 16,
                    color: isDeposit ? '#16a34a' : '#ef4444' 
                }}>
                    {isDeposit ? '+' : ''}{item.amount} ₺
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBar} />
            
            {/* HEADER */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Cüzdanım</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* BAKİYE KARTI */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceGradient}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Ionicons name="wallet" size={24} color="white" />
                            <Text style={{ color: 'rgba(255,255,255,0.8)', marginLeft: 8, fontSize: 14 }}>
                                Mevcut Bakiye
                            </Text>
                        </View>
                        <Text style={styles.balanceAmount}>
                            {formatPrice(getBalance())}
                        </Text>
                        <TouchableOpacity 
                            style={styles.depositBtn}
                            onPress={() => setDepositModalVisible(true)}
                        >
                            <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                            <Text style={{ color: COLORS.primary, fontWeight: 'bold', marginLeft: 5 }}>
                                Bakiye Yükle
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* BİLGİ KUTUSU */}
                <View style={[styles.infoBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                    <Ionicons name="information-circle" size={20} color="#3b82f6" />
                    <Text style={{ flex: 1, marginLeft: 10, color: '#1e40af', fontSize: 13 }}>
                        İlan yayınlamak için {formatPrice(PRICING.POSTING_FEE)} bakiye gereklidir.
                    </Text>
                </View>

                {/* İŞLEM GEÇMİŞİ */}
                <View style={{ marginTop: 25 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        İşlem Geçmişi
                    </Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} />
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={50} color={theme.subText} />
                            <Text style={{ color: theme.subText, marginTop: 10, textAlign: 'center' }}>
                                Henüz işlem yok.{'\n'}Bakiye yükleyerek ilan açabilirsiniz.
                            </Text>
                        </View>
                    ) : (
                        transactions.map(tx => (
                            <View key={tx.id}>
                                {renderTransaction({ item: tx })}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* BAKİYE YÜKLEME MODALI */}
            <Modal visible={depositModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                💳 Bakiye Yükle
                            </Text>
                            <TouchableOpacity onPress={() => setDepositModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: theme.subText, marginBottom: 15 }}>
                            Yüklemek istediğiniz paketi seçin:
                        </Text>

                        {/* PAKET SEÇENEKLERİ */}
                        {PRICING.BALANCE_PACKAGES.map(pkg => (
                            <TouchableOpacity 
                                key={pkg.id}
                                style={[
                                    styles.packageCard,
                                    { 
                                        backgroundColor: selectedPackage?.id === pkg.id ? '#eff6ff' : theme.input,
                                        borderColor: selectedPackage?.id === pkg.id ? COLORS.primary : theme.border
                                    }
                                ]}
                                onPress={() => setSelectedPackage(pkg)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.text }}>
                                        {pkg.amount} ₺
                                    </Text>
                                    {pkg.bonus > 0 && (
                                        <Text style={{ color: '#16a34a', fontSize: 12, marginTop: 2 }}>
                                            +{pkg.bonus} ₺ Bonus 🎁
                                        </Text>
                                    )}
                                </View>
                                {selectedPackage?.id === pkg.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* YÜKLE BUTONU */}
                        <TouchableOpacity 
                            style={[
                                styles.loadBtn,
                                { opacity: selectedPackage ? 1 : 0.5 }
                            ]}
                            onPress={handleDeposit}
                            disabled={!selectedPackage || processing}
                        >
                            {processing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                    {selectedPackage 
                                        ? `${selectedPackage.amount + (selectedPackage.bonus || 0)} ₺ Yükle` 
                                        : 'Paket Seçin'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <Text style={{ fontSize: 11, color: theme.subText, textAlign: 'center', marginTop: 10 }}>
                            Ödeme işlemi güvenli şekilde gerçekleştirilir.
                        </Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: 15, 
        borderBottomWidth: 1 
    },
    backBtn: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },

    balanceCard: { 
        borderRadius: 20, 
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 5,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    balanceGradient: {
        backgroundColor: COLORS.primary,
        padding: 25,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 15,
    },
    depositBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 12,
    },

    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },

    txCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },

    packageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 10,
    },

    loadBtn: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 15,
    },
});