import React, { useState } from 'react';
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
  Keyboard
} from 'react-native';
import { 
  ChevronLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Wallet, 
  SmartphoneNfc,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useCartStore } from '../store/useCartStore';
import api from '../utils/api';

const UNIT_PRICE = 45;

const ConfirmOrderScreen = ({ navigation }) => {
  const { cart } = useCartStore();
  const [expandedQualities, setExpandedQualities] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');

  const groupedCart = {};
  const flatOrderSummary = [];
  let totalItems = 0;

  Object.entries(cart).forEach(([cartKey, sizes]) => {
    // Split "Quality - Type" or just "Quality"
    const parts = cartKey.split(' - ');
    const qualityBase = parts[0];
    const itemType = parts[1] || 'Standard';

    const activeSizes = Object.entries(sizes)
      .filter(([_, qty]) => qty > 0)
      .map(([size, qty]) => {
        totalItems += qty;
        flatOrderSummary.push({ quality: qualityBase, type: itemType, size, qty });
        return { type: itemType, size, qty };
      });
    
    if (activeSizes.length > 0) {
      if (!groupedCart[qualityBase]) {
        groupedCart[qualityBase] = [];
      }
      groupedCart[qualityBase].push(...activeSizes);
    }
  });

  const subtotal = totalItems * UNIT_PRICE;

  const toggleQuality = (quality) => {
    setExpandedQualities(prev => ({
      ...prev,
      [quality]: !prev[quality]
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Order</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
              <View style={styles.divider} />
              
              {Object.entries(groupedCart).map(([quality, items], index) => {
                const isExpanded = expandedQualities[quality];
                const qualityTotal = items.reduce((sum, item) => sum + item.qty, 0);
                
                return (
                  <View key={quality} style={styles.qualityGroup}>
                    <TouchableOpacity 
                      style={styles.qualityHeader}
                      onPress={() => toggleQuality(quality)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={styles.itemQuality}>{quality}</Text>
                        <Text style={styles.itemSizeSummary}>{qualityTotal} Items Selected</Text>
                      </View>
                      <View style={styles.headerRight}>
                        <Text style={styles.itemPrice}>Rs {qualityTotal * UNIT_PRICE}</Text>
                        {isExpanded ? 
                          <ChevronUp color={COLORS.primary} size={20} /> : 
                          <ChevronDown color={COLORS.primary} size={20} />
                        }
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        {items.map((item, idx) => (
                          <View key={idx} style={styles.sizeBreakdown}>
                            <Text style={styles.breakdownText}>{item.type} - Size {item.size} x {item.qty}</Text>
                            <Text style={styles.breakdownPrice}>Rs {item.qty * UNIT_PRICE}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>Rs {subtotal}</Text>
              </View>

              <TouchableOpacity 
                style={styles.addMoreButton}
                onPress={() => navigation.navigate('Quality')}
              >
                <Text style={styles.addMoreText}>+ ADD MORE ITEMS</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CONTACT DETAILS</Text>
              <View style={styles.divider} />
              
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
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
                <Text style={styles.helperText}>Admin will contact you on this number to confirm the order.</Text>
              </View>
            </View>

            <View style={styles.securityNote}>
              <ShieldCheck color={COLORS.primary} size={16} />
              <Text style={styles.securityText}>100% Secure & Hand-Delivered</Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, loading && { opacity: 0.7 }]} 
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.secondary} />
          ) : (
            <Text style={styles.payButtonText}>PLACE ORDER - Rs {subtotal}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={isSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <CheckCircle2 color={COLORS.primary} size={80} />
            <Text style={styles.successTitle}>Order Confirmed</Text>
            <Text style={styles.successSubtitle}>Our admin will call you shortly to confirm your order.</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  navHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    height: 60
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { padding: 25 },
  section: { marginBottom: 35 },
  sectionTitle: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginBottom: 20 },
  itemQuality: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  itemSizeSummary: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  itemPrice: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  qualityGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expandedContent: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingHorizontal: 18,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  sizeBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  breakdownText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  breakdownPrice: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10, 
    paddingTop: 20,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  totalLabel: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  totalValue: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold' },
  addMoreButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addMoreText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  paymentGrid: { gap: 12, marginBottom: 20 },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE'
  },
  paymentCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF9EF'
  },
  paymentIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  paymentLabel: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600', flex: 1 },
  paymentLabelSelected: { color: COLORS.textPrimary },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioCircleSelected: { borderColor: COLORS.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  inputSection: { marginTop: 10 },
  inputLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8, marginLeft: 5 },
  phoneNumberInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    padding: 18,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  helperText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 10, lineHeight: 18, fontStyle: 'italic' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 30, opacity: 0.6 },
  securityText: { color: COLORS.textSecondary, fontSize: 12 },
  footer: { padding: 25, backgroundColor: COLORS.background },
  payButton: { 
    backgroundColor: COLORS.primary, 
    padding: 20, 
    borderRadius: 18, 
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    height: 65,
    justifyContent: 'center'
  },
  payButtonText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  successCard: { width: '85%', backgroundColor: COLORS.background, borderRadius: 30, padding: 40, alignItems: 'center' },
  successTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  successSubtitle: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  closeButton: { backgroundColor: COLORS.primary, width: '100%', padding: 15, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  closeButtonText: { color: COLORS.secondary, fontWeight: 'bold' }
});

export default ConfirmOrderScreen;