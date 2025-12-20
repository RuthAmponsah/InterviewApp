import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../components/BackButton';
import { purchaseSectorPack, getPurchasedPacks } from '../services/purchaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'SectorPacks'>;

interface SectorPack {
  id: string;
  title: string;
  description: string;
  price: string;
  icon: string;
  features: string[];
  popular?: boolean;
}

const SectorPacks: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);

  const [purchasedPacks, setPurchasedPacks] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPurchasedPacks();
  }, []);

  const loadPurchasedPacks = async () => {
    const packs = await getPurchasedPacks();
    setPurchasedPacks(packs);
  };

  const packs: SectorPack[] = [
    {
      id: 'nhs-care',
      title: 'NHS & Care Interviews',
      description: 'Tailored for healthcare roles, nursing, and care positions',
      price: '£14.99',
      icon: 'medical',
      popular: true,
      features: [
        '50+ NHS-specific interview questions',
        'Values-based interview scenarios',
        'Care quality & patient safety topics',
        'Band 5-7 nursing questions',
      ],
    },
    {
      id: 'graduate',
      title: 'Graduate & Assessment Centre Pack',
      description: 'Perfect for university leavers and assessment centres',
      price: '£19.99',
      icon: 'school',
      popular: true,
      features: [
        'Graduate scheme questions',
        'Assessment centre exercises',
        'Group task scenarios',
        'Competency-based interviews',
      ],
    },
    {
      id: 'retail',
      title: 'Retail & Customer Service',
      description: 'Master customer-facing roles and retail management',
      price: '£9.99',
      icon: 'storefront',
      features: [
        'Customer service scenarios',
        'Complaint handling',
        'Sales techniques',
        'Store manager interviews',
      ],
    },
    {
      id: 'management',
      title: 'Management & Leadership Pack',
      description: 'For supervisors, managers, and leadership roles',
      price: '£14.99',
      icon: 'people',
      features: [
        'Team leadership scenarios',
        'Performance management',
        'Conflict resolution',
        'Strategic decision making',
      ],
    },
  ];

  const handlePurchaseAsync = async (pack: SectorPack) => {
    setLoading(pack.id);
    
    const result = await purchaseSectorPack(pack.id, pack.price);
    
    setLoading(null);
    
    if (result.success) {
      setPurchasedPacks([...purchasedPacks, pack.id]);
      Alert.alert(
        '🎉 Success!',
        `You've purchased the ${pack.title}.\n\nNew questions are now available in your interview practice!`
      );
    } else {
      Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
    }
  };

  const handlePurchase = (pack: SectorPack) => {
    // TODO: Integrate with payment provider
    // For now, mock the purchase
    console.log(`Purchasing pack: ${pack.id}`);
    
    alert(`🎉 Success!\n\nYou've purchased the ${pack.title}.\n\nNew questions are now available in your interview practice!`);
    
    setPurchasedPacks([...purchasedPacks, pack.id]);
  };

  const isPurchased = (packId: string) => purchasedPacks.includes(packId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Sector Packs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.introText}>
          Unlock specialized interview questions tailored to your industry. One-time purchase, lifetime access.
        </Text>

        {packs.map((pack) => (
          <View
            key={pack.id}
            style={[
              styles.packCard,
              isPurchased(pack.id) && styles.packCardPurchased,
            ]}
          >
            {pack.popular && !isPurchased(pack.id) && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}

            <View style={styles.packHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primaryBlue + '20' }]}>
                <Ionicons name={pack.icon as any} size={32} color={colors.primaryBlue} />
              </View>
              
              <View style={styles.packHeaderText}>
                <Text style={styles.packTitle}>{pack.title}</Text>
                <Text style={styles.packDescription}>{pack.description}</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {pack.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primaryBlue}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.packFooter}>
              <View>
                <Text style={styles.packPrice}>{pack.price}</Text>
                <Text style={styles.packPriceSubtext}>One-time purchase</Text>
              </View>

              {isPurchased(pack.id) ? (
                <View style={[styles.purchasedBadge, { backgroundColor: '#10b981' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.purchasedText}>Purchased</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.buyButton, { backgroundColor: colors.primaryBlue }]}
                  onPress={() => handlePurchaseAsync(pack)}
                  disabled={loading === pack.id}
                >
                  {loading === pack.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buyButtonText}>Buy Now</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.primaryBlue} />
          <Text style={styles.infoText}>
            All packs work with free and premium subscriptions. Questions are added to your interview practice immediately.
          </Text>
        </View>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 8,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingTop: 0,
    },
    introText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 24,
    },
    packCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      position: 'relative',
    },
    packCardPurchased: {
      borderColor: '#10b981',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      right: 20,
      backgroundColor: '#f59e0b',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 10,
    },
    popularText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    packHeader: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    packHeaderText: {
      flex: 1,
      justifyContent: 'center',
    },
    packTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    packDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    featuresList: {
      marginBottom: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    featureText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 10,
      flex: 1,
    },
    packFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    packPrice: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    packPriceSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    buyButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    buyButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    purchasedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
      borderRadius: 12,
    },
    purchasedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
    },
    purchasedText: {
      color: '#10b981',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: colors.primaryBlue + '15',
      padding: 16,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 24,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      marginLeft: 12,
      lineHeight: 20,
    },
  });

export default SectorPacks;
