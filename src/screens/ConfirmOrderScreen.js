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
  Image
} from 'react-native';
import { ChevronLeft, CheckCircle2, ShieldCheck, Wallet, SmartphoneNfc } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useCartStore } from '../store/useCartStore';

const UNIT_PRICE = 45;

const ConfirmOrderScreen = ({ navigation }) => {
  const { cart } = useCartStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('jazzcash');

  const orderSummary = [];
  let totalItems = 0;

  Object.entries(cart).forEach(([quality, sizes]) => {
    Object.entries(sizes).forEach(([size, qty]) => {
      if (qty > 0) {
        orderSummary.push({ quality, size, qty });
        totalItems += qty;
      }
    });
  });

  const subtotal = totalItems * UNIT_PRICE;

  const handlePayment = () => {
    setIsSuccess(true);
  };

  const PaymentOption = ({ id, label, icon: Icon }) => (
    <TouchableOpacity 
      style={[
        styles.paymentCard, 
        paymentMethod === id && styles.paymentCardSelected
      ]} 
      onPress={() => setPaymentMethod(id)}
    >
      <View style={styles.paymentIconContainer}>
        <Icon color={paymentMethod === id ? COLORS.secondary : COLORS.primary} size={24} />
      </View>
      <Text style={[
        styles.paymentLabel, 
        paymentMethod === id && styles.paymentLabelSelected
      ]}>{label}</Text>
      <View style={[
        styles.radioCircle, 
        paymentMethod === id && styles.radioCircleSelected
      ]}>
        {paymentMethod === id && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Order</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
          <View style={styles.divider} />
          {orderSummary.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View>
                <Text style={styles.itemQuality}>{item.quality}</Text>
                <Text style={styles.itemSize}>Size {item.size} x {item.qty}</Text>
              </View>
              <Text style={styles.itemPrice}>Rs {item.qty * UNIT_PRICE}</Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs {subtotal}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
          <View style={styles.paymentGrid}>
            <PaymentOption id="jazzcash" label="JazzCash" icon={SmartphoneNfc} />
            <PaymentOption id="easypaisa" label="EasyPaisa" icon={Wallet} />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput 
              placeholder="03xx xxxxxxx" 
              placeholderTextColor={COLORS.textSecondary}
              style={styles.phoneNumberInput}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.securityNote}>
          <ShieldCheck color={COLORS.primary} size={16} />
          <Text style={styles.securityText}>Secure Encrypted Payment</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Text style={styles.payButtonText}>PLACE ORDER - Rs {subtotal}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <CheckCircle2 color={COLORS.primary} size={80} />
            <Text style={styles.successTitle}>Order Confirmed</Text>
            <Text style={styles.successSubtitle}>Your premium selection is being prepared.</Text>
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
  section: { marginBottom: 30 },
  sectionTitle: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#222', marginBottom: 20 },
  orderItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15,
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 15
  },
  itemQuality: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  itemSize: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  itemPrice: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10, 
    paddingTop: 20,
    paddingHorizontal: 5
  },
  totalLabel: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  totalValue: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold' },
  
  paymentGrid: { gap: 12, marginBottom: 20 },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222'
  },
  paymentCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#1A1A1A'
  },
  paymentIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#111',
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
    borderColor: '#444',
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
    borderColor: '#222'
  },

  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, opacity: 0.6 },
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
    elevation: 8
  },
  payButtonText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  successCard: { width: '85%', backgroundColor: COLORS.surface, borderRadius: 30, padding: 40, alignItems: 'center' },
  successTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  successSubtitle: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  closeButton: { backgroundColor: COLORS.primary, width: '100%', padding: 15, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  closeButtonText: { color: COLORS.secondary, fontWeight: 'bold' }
});

export default ConfirmOrderScreen;