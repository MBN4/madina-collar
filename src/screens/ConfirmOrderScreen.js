import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Easing,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronDown,
  CreditCard,
  Truck
} from 'lucide-react-native';
import { COLORS, QUALITY_THEMES } from '../theme/colors';
import { useCartStore } from '../store/useCartStore';
import api from '../utils/api';

const UNIT_PRICE = 45;

const AnimatedChevron = ({ isExpanded, theme }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <ChevronDown color={theme.primary} size={20} />
    </Animated.View>
  );
};

const ConfirmOrderScreen = ({ navigation }) => {
  const { cart } = useCartStore();
  const [expandedQualities, setExpandedQualities] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');

  const entranceAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;

  // Derive current theme from the first item in cart
  const firstCartKey = Object.keys(cart)[0];
  const firstQuality = firstCartKey ? firstCartKey.split('|')[0] : 'Madina Collar';
  const currentTheme = QUALITY_THEMES[firstQuality] || QUALITY_THEMES['Madina Collar'];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  useEffect(() => {
    if (isSuccess) {
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true
      }).start();
    } else {
      modalScale.setValue(0.8);
    }
  }, [isSuccess]);

  const groupedCart = {};
  const flatOrderSummary = [];
  let totalItems = 0;

  Object.entries(cart).forEach(([cartKey, sizes]) => {
    // Keys format: quality|selectedType|selectedCategory|selectedColor.name|selectedWidth
    const parts = cartKey.split('|');
    const qualityBase = parts[0];
    const itemType = parts[1] || 'Standard';
    const category = parts[2] || '';
    const color = parts[3] || '';
    const width = parts[4] || '';

    const activeSizes = Object.entries(sizes)
      .filter(([_, qty]) => qty > 0)
      .map(([size, qty]) => {
        totalItems += qty;
        flatOrderSummary.push({ quality: qualityBase, type: itemType, size, qty });
        return { quality: qualityBase, type: itemType, category, color, width, size, qty };
      });
    
    if (activeSizes.length > 0) {
      if (!groupedCart[cartKey]) {
        groupedCart[cartKey] = [];
      }
      groupedCart[cartKey].push(...activeSizes);
    }
  });

  const subtotal = totalItems * UNIT_PRICE;

  const toggleQuality = (key) => {
    setExpandedQualities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePayment = async () => {
    if (totalItems === 0) {
      return Alert.alert("Empty Order", "Your cart is empty. Please select some items first.");
    }
    if (!accountNumber || accountNumber.length !== 11) {
      return Alert.alert("Invalid Number", "Please enter a valid 11-digit phone number (e.g. 03XXXXXXXXX)");
    }

    setLoading(true);
    try {
      await api.post('/orders/place', {
        cartItems: flatOrderSummary,
        totalAmount: subtotal,
        paymentMethod: 'phone_contact',
        accountNumber: accountNumber
      });
      setIsSuccess(true);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.msg || "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={currentTheme.gradient} style={{ height: 240 }}>
        <View style={styles.logoHeader}>
           <Image source={require('../../assets/images/madina-collar-round.png')} style={styles.headerLogo} resizeMode="contain" />
        </View>
        <View style={[styles.navHeader, { marginTop: -80, paddingBottom: 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <View style={styles.iconCircle}>
              <ChevronLeft color={COLORS.textPrimary} size={28} />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={{ opacity: entranceAnim, transform: [{ translateY: slideAnim }] }}>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIcon, { backgroundColor: currentTheme.primary + '15' }]}>
                       <CreditCard size={18} color={currentTheme.primary} />
                    </View>
                    <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
                  </View>
                  
                  {Object.entries(groupedCart).map(([cartKey, items], index) => {
                    const isExpanded = expandedQualities[cartKey];
                    const qualityTotal = items.reduce((sum, item) => sum + item.qty, 0);
                    const firstItem = items[0];
                    const itemTheme = QUALITY_THEMES[firstItem.quality] || currentTheme;
                    
                    // Format human readable label
                    const label = `${firstItem.category} ${firstItem.type}${firstItem.width ? ` (${firstItem.width})` : ''}`;

                    return (
                      <View key={cartKey} style={styles.qualityGroup}>
                        <TouchableOpacity 
                          style={styles.qualityHeader}
                          onPress={() => toggleQuality(cartKey)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={styles.itemQuality}>{firstItem.type} Styles</Text>
                            <Text numberOfLines={1} style={styles.itemDetailText}>{label} • {firstItem.color}</Text>
                            <View style={styles.itemBadge}>
                               <Text style={[styles.itemSizeSummary, { color: itemTheme.primary }]}>{qualityTotal} Items Selected</Text>
                            </View>
                          </View>
                          <View style={styles.headerRight}>
                            <Text style={styles.itemPrice}>Rs {qualityTotal * UNIT_PRICE}</Text>
                            <AnimatedChevron isExpanded={isExpanded} theme={itemTheme} />
                          </View>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            {items.map((item, idx) => (
                              <View key={idx} style={styles.sizeBreakdown}>
                                <Text style={styles.breakdownText}>Size {item.size} x {item.qty}</Text>
                                <Text style={styles.breakdownPrice}>Rs {item.qty * UNIT_PRICE}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                  
                  <View style={styles.totalCard}>
                     <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Items Total</Text>
                        <Text style={styles.totalValueText}>Rs {subtotal}</Text>
                     </View>
                     <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Delivery</Text>
                        <Text style={[styles.totalValueText, { color: '#4CAF50' }]}>FREE</Text>
                     </View>
                     <View style={[styles.totalRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' }]}>
                        <Text style={styles.grandTotalLabel}>Grand Total</Text>
                        <Text style={[styles.grandTotalValue, { color: currentTheme.primary }]}>Rs {subtotal}</Text>
                     </View>
                  </View>

                  <TouchableOpacity 
                    activeOpacity={0.8}
                    style={[styles.addMoreButton, { borderColor: currentTheme.primary }]}
                    onPress={() => navigation.navigate('Quality')}
                  >
                    <Text style={[styles.addMoreText, { color: currentTheme.primary }]}>+ ADD MORE ITEMS</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.section, { marginTop: 10 }]}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIcon, { backgroundColor: currentTheme.primary + '15' }]}>
                       <Truck size={18} color={currentTheme.primary} />
                    </View>
                    <Text style={styles.sectionTitle}>CONTACT DETAILS</Text>
                  </View>
                  
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>Mobile Number for Confirmation</Text>
                    <TextInput 
                      placeholder="03XXXXXXXXX" 
                      placeholderTextColor={COLORS.textSecondary}
                      style={styles.phoneNumberInput}
                      keyboardType="numeric"
                      maxLength={11}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                    <View style={styles.infoBox}>
                      <Text style={styles.helperText}>Our executive will call you to confirm your order details and delivery time.</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.securityNote}>
                  <ShieldCheck color={currentTheme.primary} size={16} />
                  <Text style={styles.securityText}>Authentic Madina Collar Quality Guaranteed</Text>
                </View>
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.payButton, { backgroundColor: currentTheme.primary, shadowColor: currentTheme.primary }, loading && { opacity: 0.7 }]} 
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.payButtonText}>PLACE YOUR ORDER</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={isSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.successCard, { transform: [{ scale: modalScale }] }]}>
            <View style={[styles.successIconWrapper, { backgroundColor: currentTheme.primary }]}>
              <CheckCircle2 color="#FFF" size={50} />
            </View>
            <Text style={styles.successTitle}>Order Received!</Text>
            <Text style={styles.successSubtitle}>Thank you for choosing Madina Collar. We'll be in touch very soon.</Text>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.closeButton, { backgroundColor: currentTheme.primary }]}
              onPress={() => {
                setIsSuccess(false);
                navigation.navigate('Quality');
              }}
            >
              <Text style={styles.closeButtonText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  logoHeader: { alignItems: 'center', paddingTop: 60, height: 140 },
  headerLogo: { width: 80, height: 80 },
  navHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', opacity: 0.6, marginTop: 2 },
  contentContainer: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: -35 },
  scrollContent: { padding: 25, paddingBottom: 150 },
  section: { marginBottom: 35 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '900', letterSpacing: 1.5, opacity: 0.8 },
  itemQuality: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  itemDetailText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 3 },
  itemBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: COLORS.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  itemSizeSummary: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemPrice: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', marginRight: 10 },
  qualityGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  qualityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  expandedContent: { backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingBottom: 18, borderTopWidth: 1, borderTopColor: '#F8F8F8' },
  sizeBreakdown: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  breakdownText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  breakdownPrice: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  totalCard: { backgroundColor: COLORS.surface, borderRadius: 25, padding: 20, marginTop: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  totalValueText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  grandTotalLabel: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  grandTotalValue: { fontSize: 26, fontWeight: '900' },
  addMoreButton: { marginTop: 25, padding: 20, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', backgroundColor: '#FFF' },
  addMoreText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  inputCard: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', elevation: 5 },
  inputLabel: { color: COLORS.textPrimary, fontSize: 15, marginBottom: 15, fontWeight: '800' },
  phoneNumberInput: { backgroundColor: COLORS.surface, color: COLORS.textPrimary, padding: 20, borderRadius: 18, fontSize: 20, fontWeight: '900', borderWidth: 1.5, borderColor: '#EEE', textAlign: 'center', letterSpacing: 2.5 },
  infoBox: { backgroundColor: '#FFF9C4', padding: 15, borderRadius: 15, marginTop: 20 },
  helperText: { color: '#856404', fontSize: 12, lineHeight: 18, fontWeight: '700', fontStyle: 'italic' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 40, opacity: 0.6 },
  securityText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  payButton: { padding: 22, borderRadius: 25, alignItems: 'center', elevation: 15, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  payButtonText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  successCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 40, padding: 40, alignItems: 'center', elevation: 25 },
  successIconWrapper: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 25, elevation: 10, shadowOpacity: 0.3, shadowRadius: 10 },
  successTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '900' },
  successSubtitle: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 15, lineHeight: 24, fontWeight: '600', fontSize: 15 },
  closeButton: { width: '100%', padding: 20, borderRadius: 20, marginTop: 40, alignItems: 'center', elevation: 8 },
  closeButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});

export default ConfirmOrderScreen;

