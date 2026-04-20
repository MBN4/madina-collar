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
  Easing
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
      <LinearGradient colors={currentTheme.gradient} style={{ height: 210 }}>
        <View style={[styles.navHeader, { paddingTop: 90 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <View style={styles.iconCircle}>
              <ChevronLeft color={COLORS.textPrimary} size={28} />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[styles.headerTitle, { color: '#000' }]}>Review Order</Text>
          </View>
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
                    <CreditCard size={18} color={currentTheme.primary} style={{ marginRight: 8 }} />
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
                            <Text style={[styles.itemSizeSummary, { color: itemTheme.primary }]}>{qualityTotal} Items Selected</Text>
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
                  
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={[styles.totalValue, { color: currentTheme.primary }]}>Rs {subtotal}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.addMoreButton}
                    onPress={() => navigation.navigate('Quality')}
                  >
                    <Text style={[styles.addMoreText, { color: currentTheme.primary, borderColor: currentTheme.primary }]}>+ ADD MORE ITEMS</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.section, { marginTop: 10 }]}>
                  <View style={styles.sectionHeader}>
                    <Truck size={18} color={currentTheme.primary} style={{ marginRight: 8 }} />
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
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <CheckCircle2 color="#FFF" size={50} />
            </View>
            <Text style={styles.successTitle}>Order Received!</Text>
            <Text style={styles.successSubtitle}>Thank you for choosing Madina Collar. We'll be in touch very soon.</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setIsSuccess(false);
                navigation.navigate('Quality');
              }}
            >
              <Text style={styles.closeButtonText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  contentContainer: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -35 },
  scrollContent: { padding: 25, paddingBottom: 120 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  itemQuality: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  itemDetailText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 2 },
  itemSizeSummary: { color: COLORS.primary, fontSize: 11, marginTop: 4, fontWeight: '800', textTransform: 'uppercase' },
  itemPrice: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', marginRight: 10 },
  qualityGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  qualityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  expandedContent: { backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingBottom: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  sizeBreakdown: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  breakdownText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  breakdownPrice: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 20, paddingHorizontal: 5, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  totalLabel: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  totalValue: { color: COLORS.primary, fontSize: 32, fontWeight: '900' },
  addMoreButton: { marginTop: 25, padding: 18, borderRadius: 15, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', alignItems: 'center', backgroundColor: COLORS.surface },
  addMoreText: { color: COLORS.primary, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  inputCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 3 },
  inputLabel: { color: COLORS.textPrimary, fontSize: 14, marginBottom: 12, fontWeight: '700' },
  phoneNumberInput: { backgroundColor: COLORS.surface, color: COLORS.textPrimary, padding: 18, borderRadius: 15, fontSize: 18, fontWeight: '800', borderWidth: 1, borderColor: '#DDD', textAlign: 'center', letterSpacing: 2 },
  infoBox: { backgroundColor: '#FFF9C4', padding: 12, borderRadius: 12, marginTop: 15 },
  helperText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '600', fontStyle: 'italic' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 30, opacity: 0.7 },
  securityText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  payButton: { backgroundColor: COLORS.primary, padding: 22, borderRadius: 20, alignItems: 'center', elevation: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  payButtonText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  successCard: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 35, padding: 40, alignItems: 'center', elevation: 20 },
  successIconWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', marginTop: 10 },
  successSubtitle: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 15, lineHeight: 22, fontWeight: '600' },
  closeButton: { backgroundColor: COLORS.primary, width: '100%', padding: 18, borderRadius: 15, marginTop: 35, alignItems: 'center', elevation: 8 },
  closeButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
});

export default ConfirmOrderScreen;
