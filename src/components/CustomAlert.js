// =====================================================
// 🔔 CUSTOM ALERT - Modern Bildirim Komponenti
// =====================================================
// Uygulama genelinde kullanılacak özel alert tasarımı
// =====================================================

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

// Alert tipleri ve ikonları
const ALERT_TYPES = {
    success: {
        icon: 'checkmark-circle',
        color: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    error: {
        icon: 'close-circle',
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    warning: {
        icon: 'warning',
        color: '#F59E0B',
        backgroundColor: '#FFFBEB',
    },
    info: {
        icon: 'information-circle',
        color: COLORS.primary,
        backgroundColor: '#EFF6FF',
    },
};

export default function CustomAlert({
    visible,
    type = 'info',
    title,
    message,
    buttons = [],
    onClose,
}) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const alertStyle = ALERT_TYPES[type] || ALERT_TYPES.info;

    // Varsayılan buton yoksa "Tamam" ekle
    const alertButtons = buttons.length > 0 ? buttons : [{ text: 'Tamam', onPress: onClose }];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.alertContainer,
                                { transform: [{ scale: scaleAnim }] },
                            ]}
                        >
                            {/* İkon Alanı */}
                            <View style={[styles.iconContainer, { backgroundColor: alertStyle.backgroundColor }]}>
                                <Ionicons
                                    name={alertStyle.icon}
                                    size={40}
                                    color={alertStyle.color}
                                />
                            </View>

                            {/* İçerik */}
                            <View style={styles.contentContainer}>
                                {title && <Text style={styles.title}>{title}</Text>}
                                {message && <Text style={styles.message}>{message}</Text>}
                            </View>

                            {/* Butonlar */}
                            <View style={styles.buttonContainer}>
                                {alertButtons.map((button, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            index === alertButtons.length - 1
                                                ? styles.primaryButton
                                                : styles.secondaryButton,
                                            alertButtons.length === 1 && styles.singleButton,
                                        ]}
                                        onPress={() => {
                                            if (button.onPress) button.onPress();
                                            onClose();
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.buttonText,
                                                index === alertButtons.length - 1
                                                    ? styles.primaryButtonText
                                                    : styles.secondaryButtonText,
                                            ]}
                                        >
                                            {button.text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    alertContainer: {
        width: width - 100,
        maxWidth: 280,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 6,
    },
    message: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 19,
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    singleButton: {
        borderLeftWidth: 0,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
    },
    secondaryButton: {
        backgroundColor: '#F9FAFB',
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: '#FFFFFF',
    },
    secondaryButtonText: {
        color: '#6B7280',
    },
});
