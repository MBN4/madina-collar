import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, CheckCircle2, ChevronDown, ChevronUp, PlusCircle, Trash2, ArrowRight, Truck
} from 'lucide-react-native';
import axios from 'axios';
import { COLORS } from '../theme/colors';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';

const ConfirmOrderScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { cart, getTotalItems, removeItem, resetCart } = useCartStore();
  const { token, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [showDetails, setShowDetails] = useState(true);
  const [biltiInfo, setBiltiInfo] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await axios.get('http://192.168.18.18:5000/api/admin/qualities');
        setCatalog(res.data);
      } catch (err) { console.log("Catalog Error"); }
    };
    fetchCatalog();
  }, []);

  const cartItemsList = useMemo(() => {
    if (!catalog.length) return [];
    const items = [];
    Object.entries(cart).forEach(([key, sizes]) => {
      const parts = key.split('|');
      const qName = parts[0];
      const sName = parts[1];
      const catVal = parts[2];
      const colVal = parts[3];
      const widVal = parts[4] || null;
      const quality = catalog.find(q => q.name === qName);
      const style = quality?.Styles?.find(s => s.name === sName);
      Object.entries(sizes).forEach(([sizeVal, qty]) => {
        const catId = style?.ProductAttributes?.find(a => a.type === 'category' && a.value === catVal)?.id;
        const colId = style?.ProductAttributes?.find(a => a.type === 'color' && a.value === colVal)?.id;
        const widId = widVal ? style?.ProductAttributes?.find(a => a.type === 'width' && a.value === widVal)?.id : null;
        const sizeId = style?.ProductAttributes?.find(a => a.type === 'size' && a.value === sizeVal)?.id;
        const matrixMatch = style?.PriceMatrices?.find(p => p.categoryId === catId && p.colorId === colId && (widId ? p.widthId === widId : true) && p.sizeId === sizeId);
        const price = matrixMatch ? Number(matrixMatch.price) : 0;
        items.push({ key, quality: qName, style: sName, category: catVal, color: colVal, width: widVal, size: sizeVal, qty, price });
      });
    });
    return items;
  }, [cart, catalog]);

  const totalAmount = useMemo(() => cartItemsList.reduce((acc, item) => acc + (item.price * item.qty), 0), [cartItemsList]);

  const handlePlaceOrder = async () => {
    if (!biltiInfo) return Alert.alert("Required", "Please enter Bilti information.");
    setLoading(true);
    try {
      await axios.post('http://192.168.18.18:5000/api/orders/place', {
        cartItems: cartItemsList, totalAmount, paymentMethod: 'Transfer / Cash', biltiInfo
      }, { headers: { Authorization: `Bearer ${token}` } });
      setLoading(false);
      resetCart();
      setShowSuccess(true);
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 401) { logout(); navigation.navigate('Auth'); }
      else Alert.alert("Order Error", "Connection failed.");
    }
  };

  const SuccessPopup = () => (
    <Modal visible={showSuccess} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View entering={ZoomIn.duration(600)} style={styles.successCard}>
          <View style={styles.successIconBox}><CheckCircle2 size={50} color="#FFD700" /></View>
          <Text style={styles.urduTitle}>آپ کے اعتماد کا شکریہ</Text>
          <View style={styles.urduTextContainer}>
            <Text style={styles.urduParagraph}>آپ نے پوری مارکیٹ میں سے مدینہ کالر کا انتخاب کیا، یہ ہمارے لیے اعزاز ہے۔</Text>
            <Text style={styles.urduParagraph}>آپ کے اس اعتماد پر ہم دل کی گہرائیوں سے شکر گزار ہیں۔</Text>
            <Text style={styles.urduParagraph}>دعا ہے کہ مدینہ کالر کی طرف سے لیا گیا ہر پروڈکٹ آپ کے لیے خیر و برکت اور کامیابی کا ذریعہ بنے —آمین 🤲</Text>
          </View>
          <Text style={styles.slogan}>✨ Trust Chosen. Quality Delivered</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => { setShowSuccess(false); navigation.popToTop(); }}><Text style={styles.closeBtnText}>CONTINUE SHOPPING</Text></TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SuccessPopup />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ChevronLeft color={COLORS.textPrimary} size={24} /></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.headerTitle}>Order Summary</Text></View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.addMore}><PlusCircle size={18} color={COLORS.accent} /><Text style={styles.addText}>ADD</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}><Text style={styles.summaryLabel}>TOTAL PAYABLE</Text><TouchableOpacity onPress={() => setShowDetails(!showDetails)} style={styles.trayToggle}><Text style={styles.trayToggleText}>{showDetails ? 'Hide' : 'Show'}</Text>{showDetails ? <ChevronUp size={14} color={COLORS.accent} /> : <ChevronDown size={14} color={COLORS.accent} />}</TouchableOpacity></View>
          <View style={styles.mainStats}><View><Text style={styles.statSub}>Total Volume</Text><Text style={styles.statVal}>{getTotalItems()} Pcs</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={styles.statSub}>Total Amount</Text><Text style={styles.grandPrice}>Rs {totalAmount}</Text></View></View>
          {showDetails && (
            <Animated.View entering={FadeInDown} style={styles.itemTray}>{cartItemsList.map((item, idx) => (<View key={idx} style={styles.itemRow}><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{item.quality} • {item.style}</Text><Text style={styles.itemMeta}>{item.category} • {item.color} {item.width ? `• W:${item.width}` : ''} • Size: {item.size}</Text></View><View style={{ alignItems: 'flex-end', marginRight: 15 }}><Text style={styles.itemQty}>{item.qty}x</Text><Text style={styles.itemRate}>@ {item.price}</Text></View><TouchableOpacity onPress={() => removeItem(item.key, item.size)}><Trash2 size={16} color={COLORS.error} /></TouchableOpacity></View>))}</Animated.View>
          )}
        </View>
        <View style={styles.inputGroup}><Text style={styles.inputLabel}>Bilti Details (Address / Phone)</Text><View style={[styles.inputField, { alignItems: 'flex-start', paddingTop: 15 }]}><Truck size={18} color={COLORS.accent} /><TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} placeholder="Enter Bilti info..." placeholderTextColor="#999" value={biltiInfo} onChangeText={setBiltiInfo} multiline /></View></View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 25) }]}><TouchableOpacity style={styles.confirmBtn} onPress={handlePlaceOrder} disabled={loading || getTotalItems() === 0}><View style={styles.btnInner}><Text style={styles.btnText}>{loading ? 'PROCESSING...' : 'PLACE ORDER'}</Text>{!loading && <CheckCircle2 size={20} color="#FFF" />}</View></TouchableOpacity></View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFB' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
  addMore: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 5 },
  addText: { fontSize: 10, fontWeight: '900', color: COLORS.textPrimary },
  scrollContent: { padding: 20 },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 25, elevation: 10, shadowColor: COLORS.primary, shadowOpacity: 0.1, marginBottom: 30 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  summaryLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 2 },
  trayToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  trayToggleText: { fontSize: 10, fontWeight: '900', color: COLORS.accent },
  mainStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statSub: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  statVal: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary },
  grandPrice: { fontSize: 30, fontWeight: '900', color: COLORS.accent },
  itemTray: { marginTop: 25, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FAFAFA' },
  itemTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, textTransform: 'uppercase' },
  itemMeta: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  itemQty: { fontSize: 14, fontWeight: '900', color: COLORS.primary },
  itemRate: { fontSize: 9, color: '#CCC', fontWeight: 'bold' },
  inputGroup: { gap: 12 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: COLORS.textSecondary, marginLeft: 5, textTransform: 'uppercase' },
  inputField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, paddingHorizontal: 15, borderWidth: 1, borderColor: '#EEE' },
  input: { flex: 1, paddingVertical: 15, marginLeft: 10, fontWeight: '700', color: COLORS.textPrimary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 40, borderTopRightRadius: 40, elevation: 30 },
  confirmBtn: { backgroundColor: COLORS.primary, borderRadius: 25 },
  btnInner: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  successCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 40, padding: 30, alignItems: 'center' },
  successIconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  urduTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  urduTextContainer: { width: '100%' },
  urduParagraph: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  slogan: { fontSize: 12, fontWeight: '900', color: COLORS.accent, textAlign: 'center', marginBottom: 25 },
  closeBtn: { backgroundColor: COLORS.textPrimary, width: '100%', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13 }
});

export default ConfirmOrderScreen;