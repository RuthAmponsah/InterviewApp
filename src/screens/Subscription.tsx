import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getPackageSubscriptionTier,
  getSubscriptionOfferings, 
  purchaseSubscription, 
  restorePurchases 
} from '../services/purchaseService';
import { PurchasesPackage } from 'react-native-purchases';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

const { width, height } = Dimensions.get('window');

const Subscription: React.FC<Props> = ({ navigation, route }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const showCloseButton = route.params?.showClose !== false;

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    const offerings = await getSubscriptionOfferings();
    if (offerings?.availablePackages) {
      const monthly = offerings.availablePackages.find(pkg =>
        getPackageSubscriptionTier(pkg) === 'monthly'
      );
      const annual = offerings.availablePackages.find(pkg =>
        getPackageSubscriptionTier(pkg) === 'annual'
      );
      setMonthlyPackage(monthly || null);
      setAnnualPackage(annual || null);
      console.log('Subscription packages loaded - monthly:', monthly?.identifier, 'annual:', annual?.identifier);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    
    const packageToPurchase = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
    
    if (!packageToPurchase) {
      Alert.alert(
        'Subscription Unavailable',
        'Subscription products are not available right now. Please try again later.'
      );
      setLoading(false);
      return;
    }
    
    const result = await purchaseSubscription(packageToPurchase);
    
    setLoading(false);
    
    if (result.success) {
      Alert.alert(
        '🎉 Welcome to Premium!',
        'You now have unlimited interview practice!\n\nYour subscription is active immediately.',
        [{ text: 'Start Practicing', onPress: () => navigation.goBack() }]
      );
    } else if (result.error !== 'User cancelled') {
      Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const result = await restorePurchases();
    setLoading(false);
    
    if (result.success) {
      Alert.alert('✅ Restored', 'Your purchases have been restored!');
    } else {
      Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases for this account.');
    }
  };

  const features = [
    { icon: 'infinite', text: 'Unlimited interviews' },
    { icon: 'document-text', text: 'Unlock interview transcripts' },
    { icon: 'help', text: 'Full access to role specific question bank' },
    { icon: 'sparkles', text: 'Unlimited AI analysis in question bank' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark 
          ? ['#1a1a2e', '#16213e', '#0f3460']
          : ['#667eea', '#764ba2', '#f093fb']
        }
        style={styles.gradientHeader}
      >
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Unlock Premium</Text>
          <Text style={styles.headerSubtitle}>
            Unlimited interviews, transcripts, and AI analysis
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryBlue + '20' }]}>
                <Ionicons 
                  name={feature.icon as any} 
                  size={22} 
                  color={colors.primaryBlue} 
                />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {/* Annual Plan (Recommended) */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'annual' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>BEST VALUE</Text>
            </View>
            
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>Annual</Text>
                <Text style={styles.planSavings}>Save 37%</Text>
              </View>
              <View>
                <Text style={styles.planPrice}>£59.99</Text>
                <Text style={styles.planPeriod}>per year</Text>
              </View>
            </View>
            
            <Text style={styles.planDetail}>
              £5.00/month • Billed annually
            </Text>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>Monthly</Text>
              </View>
              <View>
                <Text style={styles.planPrice}>£7.99</Text>
                <Text style={styles.planPeriod}>per month</Text>
              </View>
            </View>
            
            <Text style={styles.planDetail}>
              Billed monthly • Cancel anytime
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeButton, { backgroundColor: colors.primaryBlue }]}
          onPress={handleSubscribe}
        >
          <Text style={styles.subscribeButtonText}>
            Start {selectedPlan === 'annual' ? 'Annual' : 'Monthly'} Plan
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          Payment will be charged to your account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </Text>

        <TouchableOpacity onPress={handleRestore} disabled={loading}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    gradientHeader: {
      paddingTop: 60,
      paddingBottom: 40,
      paddingHorizontal: 24,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    headerContent: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: '#fff',
      marginBottom: 8,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 24,
    },
    featuresContainer: {
      marginBottom: 32,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    featureText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
    },
    plansContainer: {
      marginBottom: 24,
    },
    planCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
    },
    planCardSelected: {
      borderColor: colors.primaryBlue,
      backgroundColor: colors.primaryBlue + '10',
    },
    recommendedBadge: {
      position: 'absolute',
      top: -10,
      right: 20,
      backgroundColor: '#10b981',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    recommendedText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    planName: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    planSavings: {
      fontSize: 14,
      color: '#10b981',
      fontWeight: '600',
    },
    planPrice: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
    },
    planPeriod: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'right',
    },
    planDetail: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    subscribeButton: {
      paddingVertical: 18,
      borderRadius: 14,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    subscribeButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
    },
    terms: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 18,
    },
    restorePurchases: {
      fontSize: 14,
      color: colors.primaryBlue,
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: 24,
    },
    restoreText: {
      fontSize: 14,
      color: colors.primaryBlue,
      textAlign: 'center',
      fontWeight: '600',
    },
  });

export default Subscription;
