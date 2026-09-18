// src/screens/LegalScreen.js
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useUI } from '../context/UIContext';

// ✅ YENİ: KVKK metinlerini import et
import LEGAL_TEXTS from '../constants/legalTexts';

const PRIVACY_URL = 'https://ennesa.github.io/ustabul-privacy/';
const TERMS_URL = 'https://ennesa.github.io/ustabul-privacy/terms.html';

export default function LegalScreen({ navigation, route }) {
    const { theme } = useUI();
    
    // ✅ YENİ: route'dan gelen type parametresini al (RegisterScreen'den gelirse)
    const requestedType = route?.params?.type;
    
    // ✅ YENİ: Eğer RegisterScreen'den geliyorsa, uygulama içi göster
    const [showInApp, setShowInApp] = useState(!!requestedType);
    const [activeTab, setActiveTab] = useState(requestedType || 'privacy');

    const openLink = async (url) => {
        await WebBrowser.openBrowserAsync(url);
    };

    // ✅ YENİ: Uygulama içi içerik render fonksiyonu
    const renderInAppContent = () => {
        let content;
        
        if (activeTab === 'privacy') {
            content = LEGAL_TEXTS.privacyPolicy;
        } else if (activeTab === 'terms') {
            content = LEGAL_TEXTS.termsOfUse;
        } else if (activeTab === 'consent') {
            content = LEGAL_TEXTS.consentText;
        }

        return (
            <View style={styles.inAppContainer}>
                {/* Sekme Seçimi */}
                <View style={[styles.tabContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
                        onPress={() => setActiveTab('privacy')}
                    >
                        <Text style={[styles.tabText, { color: theme.subText }, activeTab === 'privacy' && styles.activeTabText]}>
                            Gizlilik
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
                        onPress={() => setActiveTab('terms')}
                    >
                        <Text style={[styles.tabText, { color: theme.subText }, activeTab === 'terms' && styles.activeTabText]}>
                            Kullanım
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'consent' && styles.activeTab]}
                        onPress={() => setActiveTab('consent')}
                    >
                        <Text style={[styles.tabText, { color: theme.subText }, activeTab === 'consent' && styles.activeTabText]}>
                            Açık Rıza
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* İçerik */}
                <ScrollView style={styles.contentScroll}>
                    <Text style={[styles.contentTitle, { color: theme.text }]}>
                        {content.title}
                    </Text>
                    <Text style={[styles.contentDate, { color: theme.subText }]}>
                        Son Güncelleme: {content.lastUpdated}
                    </Text>

                    {activeTab === 'consent' ? (
                        // Açık Rıza için direkt metin
                        <Text style={[styles.contentText, { color: theme.text }]}>
                            {content.content}
                        </Text>
                    ) : (
                        // Gizlilik ve Kullanım için bölümler
                        content.sections.map((section, index) => (
                            <View key={index} style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>
                                    {section.title}
                                </Text>
                                <Text style={[styles.sectionContent, { color: theme.text }]}>
                                    {section.content}
                                </Text>
                            </View>
                        ))
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Alt Buton - Web'de Aç */}
                <TouchableOpacity
                    style={[styles.webButton, { backgroundColor: theme.card, borderTopColor: theme.border }]}
                    onPress={() => {
                        const url = activeTab === 'terms' ? TERMS_URL : PRIVACY_URL;
                        openLink(url);
                    }}
                >
                    <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.webButtonText}>Web'de Aç</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // ✅ Eğer uygulama içi gösterim isteniyorsa
    if (showInApp) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={theme.statusBar} />
                
                {/* HEADER */}
                <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Yasal Belgeler</Text>
                    <TouchableOpacity onPress={() => setShowInApp(false)} style={styles.backBtn}>
                        <Ionicons name="list-outline" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {renderInAppContent()}
            </SafeAreaView>
        );
    }

    // ✅ Varsayılan: Kartlar ile web linklerine yönlendirme (mevcut tasarımınız)
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBar} />
            
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Yasal</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ✅ YENİ: Uygulama İçi Görüntüle Kartı */}
                <TouchableOpacity 
                    style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => setShowInApp(true)}
                >
                    <View style={styles.cardIcon}>
                        <Ionicons name="document-text" size={28} color={COLORS.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>KVKK Belgeleri</Text>
                        <Text style={[styles.cardDesc, { color: theme.subText }]}>
                            Gizlilik, Kullanım Koşulları ve Açık Rıza Metni
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.subText} />
                </TouchableOpacity>

                {/* Gizlilik Politikası - Web */}
                <TouchableOpacity 
                    style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => openLink(PRIVACY_URL)}
                >
                    <View style={styles.cardIcon}>
                        <Ionicons name="shield-checkmark-outline" size={28} color={COLORS.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Gizlilik Politikası (Web)</Text>
                        <Text style={[styles.cardDesc, { color: theme.subText }]}>
                            Verilerinizi nasıl topladığımızı ve kullandığımızı öğrenin
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.subText} />
                </TouchableOpacity>

                {/* Kullanım Koşulları - Web */}
                <TouchableOpacity 
                    style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => openLink(TERMS_URL)}
                >
                    <View style={styles.cardIcon}>
                        <Ionicons name="document-text-outline" size={28} color={COLORS.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Kullanım Koşulları (Web)</Text>
                        <Text style={[styles.cardDesc, { color: theme.subText }]}>
                            Uygulama kullanım şartlarını inceleyin
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.subText} />
                </TouchableOpacity>

                {/* Uygulama Bilgisi */}
                <View style={[styles.infoBox, { backgroundColor: theme.input }]}>
                    <Text style={[styles.infoTitle, { color: theme.text }]}>Ustabul</Text>
                    <Text style={[styles.infoText, { color: theme.subText }]}>Versiyon 1.0.0</Text>
                    <Text style={[styles.infoText, { color: theme.subText }]}>© 2025 Tüm hakları saklıdır.</Text>
                </View>

                {/* İletişim */}
                <TouchableOpacity 
                    style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => openLink('mailto:destek@ustabul.com')}
                >
                    <View style={styles.cardIcon}>
                        <Ionicons name="mail-outline" size={28} color={COLORS.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>İletişim</Text>
                        <Text style={[styles.cardDesc, { color: theme.subText }]}>
                            destek@ustabul.com
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.subText} />
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
    },
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
    headerTitle: { 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    content: { 
        padding: 20 
    },
    card: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        marginBottom: 12 
    },
    cardIcon: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        backgroundColor: '#e0f2fe', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    cardContent: { 
        flex: 1, 
        marginLeft: 15 
    },
    cardTitle: { 
        fontSize: 16, 
        fontWeight: '600', 
        marginBottom: 3 
    },
    cardDesc: { 
        fontSize: 13 
    },
    infoBox: { 
        padding: 20, 
        borderRadius: 12, 
        alignItems: 'center', 
        marginVertical: 20 
    },
    infoTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 5 
    },
    infoText: { 
        fontSize: 13, 
        marginTop: 3 
    },

    // ✅ YENİ: Uygulama içi görüntüleme stilleri
    inAppContainer: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    activeTabText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    contentScroll: {
        flex: 1,
        padding: 16,
    },
    contentTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    contentDate: {
        fontSize: 13,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 12,
    },
    sectionContent: {
        fontSize: 14,
        lineHeight: 22,
    },
    contentText: {
        fontSize: 14,
        lineHeight: 22,
    },
    webButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderTopWidth: 1,
    },
    webButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 8,
    },
});
