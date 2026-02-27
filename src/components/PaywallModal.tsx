import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/colors';
import {
  getSubscriptionOfferings,
  purchaseSubscription,
  restorePurchases,
} from '../services/purchaseService';
import { PurchasesPackage } from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FEATURES = [
  { icon: 'infinite', text: 'Unlimited interviews' },
  { icon: 'document-text', text: 'Unlock interview transcripts' },
  { icon: 'help', text: 'Full access to role specific question bank' },
  { icon: 'sparkles', text: 'Unlimited AI analysis in question bank' },
];

export default function PaywallModal({ visible, onClose, onSuccess }: PaywallModalProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    const offerings = await getSubscriptionOfferings();
    if (offerings?.availablePackages) {
      const monthly = offerings.availablePackages.find(pkg =>
        pkg.identifier.includes('monthly')
      );
      const annual = offerings.availablePackages.find(pkg =>
        pkg.identifier.includes('annual')
      );
      setMonthlyPackage(monthly || null);
      setAnnualPackage(annual || null);
    }
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    const packageToPurchase = selectedPlan === 'annual' ? annualPackage : monthlyPackage;

    if (!packageToPurchase) {
      // Fallback to mock purchase if RevenueCat not configured
      Alert.alert(
        '🎉 Success!',
        `You're now on the ${selectedPlan === 'annual' ? 'Annual' : 'Monthly'} plan.\n\nEnjoy unlimited interviews!`,
        [{ text: 'OK', onPress: () => { onClose(); onSuccess?.(); } }]
      );
      setLoading(false);
      return;
    }

    const result = await purchaseSubscription(packageToPurchase);

    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🎉 Welcome to Premium!',
        'You now have unlimited interview practice!\n\nYour subscription is active immediately.',
        [{ text: 'Start Practicing', onPress: () => { onClose(); onSuccess?.(); } }]
      );
    } else if (result.error !== 'User cancelled') {
      Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    const result = await restorePurchases();
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Restored', 'Your purchases have been restored!', [
        { text: 'OK', onPress: () => { onClose(); onSuccess?.(); } }
      ]);
    } else {
      Alert.alert('No Purchases Found', "We couldn't find any previous purchases for this account.");
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#666'} />
          </TouchableOpacity>

          {/* Header */}
          <LinearGradient
            colors={isDark
              ? ['#1e3a5f', '#2d5a87', '#1e3a5f']
              : ['#667eea', '#764ba2']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Ionicons name="diamond" size={40} color="#fff" />
            <Text style={styles.headerTitle}>Unlock Premium</Text>
            <Text style={styles.headerSubtitle}>
              Get unlimited practice to ace any interview
            </Text>
          </LinearGradient>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Features */}
            <View style={styles.featuresContainer}>
              {FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={feature.icon as any}
                      size={18}
                      color={colors.primaryBlue}
                    />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>

            {/* Plans */}
            <View style={styles.plansContainer}>
              {/* Annual Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'annual' && styles.planCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPlan('annual');
                }}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
                <View style={styles.planRow}>
                  <View>
                    <Text style={styles.planName}>Annual</Text>
                    <Text style={styles.planSavings}>Save 37%</Text>
                  </View>
                  <View style={styles.planPriceContainer}>
                    <Text style={styles.planPrice}>£59.99</Text>
                    <Text style={styles.planPeriod}>per year</Text>
                  </View>
                </View>
                <Text style={styles.planDetail}>£5.00/month • Billed annually</Text>
              </TouchableOpacity>

              {/* Monthly Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPlan('monthly');
                }}
              >
                <View style={styles.planRow}>
                  <View>
                    <Text style={styles.planName}>Monthly</Text>
                  </View>
                  <View style={styles.planPriceContainer}>
                    <Text style={styles.planPrice}>£7.99</Text>
                    <Text style={styles.planPeriod}>per month</Text>
                  </View>
                </View>
                <Text style={styles.planDetail}>Billed monthly • Cancel anytime</Text>
              </TouchableOpacity>
            </View>

            {/* Subscribe Button */}
            <TouchableOpacity
              style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
              onPress={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  Start {selectedPlan === 'annual' ? 'Annual' : 'Monthly'} Plan
                </Text>
              )}
            </TouchableOpacity>

            {/* Restore */}
            <TouchableOpacity onPress={handleRestore} disabled={loading}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.terms}>
              Payment charged to your account. Auto-renews unless cancelled 24hrs before period end.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    container: {
      width: width - 32,
      maxWidth: 400,
      maxHeight: height * 0.85,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    header: {
      paddingTop: 28,
      paddingBottom: 20,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: '#fff',
      marginTop: 12,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.85)',
      textAlign: 'center',
    },
    content: {
      padding: 20,
    },
    featuresContainer: {
      marginBottom: 20,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? colors.primaryBlue + '25' : colors.primaryBlue + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    featureText: {
      fontSize: 14,
      color: isDark ? '#e5e5e5' : '#333',
      fontWeight: '500',
      flex: 1,
    },
    plansContainer: {
      marginBottom: 16,
    },
    planCard: {
      backgroundColor: isDark ? '#252525' : '#f8f9fa',
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: isDark ? '#333' : '#e5e5e5',
      position: 'relative',
    },
    planCardSelected: {
      borderColor: colors.primaryBlue,
      backgroundColor: isDark ? '#1a2a3a' : colors.primaryBlue + '08',
    },
    bestValueBadge: {
      position: 'absolute',
      top: -10,
      right: 16,
      backgroundColor: '#10b981',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
    bestValueText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    planRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    planName: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#111',
      marginBottom: 2,
    },
    planSavings: {
      fontSize: 13,
      color: '#10b981',
      fontWeight: '600',
    },
    planPriceContainer: {
      alignItems: 'flex-end',
    },
    planPrice: {
      fontSize: 22,
      fontWeight: '800',
      color: isDark ? '#fff' : '#111',
    },
    planPeriod: {
      fontSize: 12,
      color: isDark ? '#999' : '#666',
    },
    planDetail: {
      fontSize: 13,
      color: isDark ? '#888' : '#666',
    },
    subscribeButton: {
      backgroundColor: colors.primaryBlue,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      shadowColor: colors.primaryBlue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    subscribeButtonDisabled: {
      opacity: 0.7,
    },
    subscribeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    restoreText: {
      fontSize: 14,
      color: colors.primaryBlue,
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: 12,
    },
    terms: {
      fontSize: 11,
      color: isDark ? '#666' : '#999',
      textAlign: 'center',
      lineHeight: 16,
      paddingBottom: 8,
    },
  });
