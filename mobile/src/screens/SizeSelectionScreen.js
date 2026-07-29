import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  ShoppingBag, 
  Check, 
  Layers 
} from 'lucide-react-native';
import api from '../utils/api';
import { COLORS, QUALITY_THEMES } from '../theme/colors';
import { useCartStore } from '../store/useCartStore';

const SizeSelectionScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { qualityId, qualityName } = route.params;
  const currentTheme = QUALITY_THEMES[qualityName] || QUALITY_THEMES['Madina Collar'];
  const { cart, updateQuantity, getTotalItems } = useCartStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qualityData, setQualityData] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWidth, setSelectedWidth] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const fetchStructure = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const res = await api.get('/admin/qualities');
      const found = res.data.find(q => q.id === qualityId);
      setQualityData(found);
    } catch (err) {
      console.error(err);
    } finally {
      if (isRefreshing) setRefreshing(false);
      else setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStructure(true);
  };

  useEffect(() => { fetchStructure(); }, [qualityId]);

  const currentStyle = useMemo(() => {
    return qualityData?.Styles?.find(s => s.name === selectedType);
  }, [qualityData, selectedType]);

  const categories = useMemo(() => currentStyle?.ProductAttributes?.filter(a => a.type === 'category') || [], [currentStyle]);
  const colors = useMemo(() => currentStyle?.ProductAttributes?.filter(a => a.type === 'color') || [], [currentStyle]);
  const widths = useMemo(() => currentStyle?.ProductAttributes?.filter(a => a.type === 'width') || [], [currentStyle]);
  
  const sizes = useMemo(() => {
    const rawSizes = currentStyle?.ProductAttributes?.filter(a => a.type === 'size') || [];
    return rawSizes.sort((a, b) => {
      const valA = parseFloat(a.value.replace(/[^\d.-]/g, '')) || 0;
      const valB = parseFloat(b.value.replace(/[^\d.-]/g, '')) || 0;
      return valA - valB;
    });
  }, [currentStyle]);

  useEffect(() => {
    if (selectedType && currentStyle) {
      if (categories.length > 0) setSelectedCategory(categories[0]);
      if (widths.length > 0) setSelectedWidth(widths[0]); else setSelectedWidth(null);
      if (colors.length > 0) setSelectedColor(colors[0]);
    }
  }, [selectedType, currentStyle]);

  const getMatrixPrice = (sizeId) => {
    if (!selectedCategory || !selectedColor) return 0;
    const match = currentStyle?.PriceMatrices?.find(p => 
      p.categoryId === selectedCategory.id && 
      p.colorId === selectedColor.id && 
      (widths.length > 0 ? p.widthId === selectedWidth?.id : true) &&
      p.sizeId === sizeId
    );
    return match ? Number(match.price) : 0;
  };

  const totalPrice = useMemo(() => {
    let total = 0;
    Object.entries(cart).forEach(([key, sizesMap]) => {
      if (key.startsWith(qualityName)) {
        const parts = key.split('|');
        const styleName = parts[1];
        const catVal = parts[2];
        const colVal = parts[3];
        const widVal = parts[4] || null;
        const styleObj = qualityData?.Styles?.find(s => s.name === styleName);
        if (!styleObj) return;
        const catAttr = styleObj.ProductAttributes?.find(a => a.type === 'category' && a.value === catVal);
        const colAttr = styleObj.ProductAttributes?.find(a => a.type === 'color' && a.value === colVal);
        const widAttr = widVal ? styleObj.ProductAttributes?.find(a => a.type === 'width' && a.value === widVal) : null;
        if (!catAttr || !colAttr) return;
        Object.entries(sizesMap).forEach(([szVal, qty]) => {
          const szAttr = styleObj.ProductAttributes?.find(a => a.type === 'size' && a.value === szVal);
          if (!szAttr) return;
          const match = styleObj.PriceMatrices?.find(p => p.categoryId === catAttr.id && p.colorId === colAttr.id && (widAttr ? p.widthId === widAttr.id : true) && p.sizeId === szAttr.id);
          total += (Number(match?.price) || 0) * qty;
        });
      }
    });
    return total;
  }, [cart, qualityData, qualityName]);

  const cartKey = useMemo(() => {
    if (!selectedType || !selectedCategory || !selectedColor) return null;
    let key = `${qualityName}|${selectedType}|${selectedCategory.value}|${selectedColor.value}`;
    if (selectedWidth) key += `|${selectedWidth.value}`;
    return key;
  }, [qualityName, selectedType, selectedCategory, selectedColor, selectedWidth]);

  const handleManualInput = (sizeValue, text) => {
    if (!cartKey) return;
    const newVal = parseInt(text.replace(/[^0-9]/g, '')) || 0;
    const currentQty = cart[cartKey]?.[sizeValue] || 0;
    updateQuantity(cartKey, sizeValue, newVal - currentQty);
  };

  const renderSizeItem = (attr, index) => {
    if (!cartKey) return null;
    const quantity = cart[cartKey]?.[attr.value] || 0;
    const isOutOfStock = !attr.in_stock;
    const price = getMatrixPrice(attr.id);
    const unpriced = !(price > 0);
    const unavailable = isOutOfStock || unpriced;
    return (
      <Animated.View key={`size-item-${attr.id}`} entering={FadeInRight.delay(index * 20)} layout={Layout.springify()} style={[styles.sizeRow, unavailable && { opacity: 0.55, backgroundColor: '#EEEEEE' }]}>
        <View>
          <Text style={[styles.sizeLabel, unavailable && { color: '#999', textDecorationLine: isOutOfStock ? 'line-through' : 'none' }]}>Size {attr.value}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, unpriced && { color: '#999' }]}>{price > 0 ? `Rs ${price}` : 'NA'}</Text>
            {isOutOfStock ? (
              <View style={styles.outBadge}><Text style={styles.outText}>OUT OF STOCK</Text></View>
            ) : unpriced ? (
              <View style={styles.outBadge}><Text style={styles.outText}>NOT AVAILABLE</Text></View>
            ) : null}
          </View>
        </View>
        <View style={[styles.controlsContainer, unavailable && { opacity: 0.4 }]}>
          <TextInput style={styles.quantityInput} value={quantity.toString()} onChangeText={(t) => !unavailable && handleManualInput(attr.value, t)} keyboardType="number-pad" editable={!unavailable} color={COLORS.textPrimary} />
          <View style={styles.arrowStack}>
            <TouchableOpacity disabled={unavailable} onPress={() => !unavailable && updateQuantity(cartKey, attr.value, 1)} style={styles.arrowButton}><ChevronUp size={18} color={currentTheme.primary} strokeWidth={3} /></TouchableOpacity>
            <TouchableOpacity disabled={unavailable} onPress={() => !unavailable && updateQuantity(cartKey, attr.value, -1)} style={styles.arrowButton}><ChevronDown size={18} color={currentTheme.primary} strokeWidth={3} /></TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) return (
    <View style={styles.loaderFull}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loaderText}>SYNCING CATALOG...</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={currentTheme.gradient} style={{ height: 230 }}>
        <View style={styles.logoHeader}><Image source={require('../../assets/images/madina-collar-round.png')} style={styles.headerLogo} resizeMode="contain" /></View>
        <TouchableOpacity onPress={() => selectedType ? setSelectedType(null) : navigation.goBack()} style={styles.backWrapper}>
          <View style={styles.backCircle}><ChevronLeft color={COLORS.textPrimary} size={24} /></View>
        </TouchableOpacity>
      </LinearGradient>
      <View style={styles.mainWrapper}>
        {!selectedType ? (
          <ScrollView 
            contentContainerStyle={styles.styleGrid}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.primary} />}
          >
            <Text style={styles.gridTitle}>Category</Text>
            {qualityData?.Styles?.map((style, index) => (
              <Animated.View key={`style-btn-${style.id}`} entering={FadeInDown.delay(index * 150)}>
                <TouchableOpacity activeOpacity={0.8} style={styles.styleCard} onPress={() => setSelectedType(style.name)}>
                  <View style={styles.iconBox}><Layers size={24} color={currentTheme.primary} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.styleName}>{style.name}</Text><Text style={styles.styleSub}>Configure Design</Text></View>
                  <View style={[styles.miniArrow, { backgroundColor: currentTheme.primary + '15' }]}><ChevronRight size={16} color={currentTheme.primary} strokeWidth={3} /></View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.configHeader}>
              <View style={styles.section}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map((cat) => (
                    <TouchableOpacity key={`cat-tab-${cat.id}`} onPress={() => setSelectedCategory(prev => prev?.id === cat.id ? null : cat)} style={[styles.tab, selectedCategory?.id === cat.id && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}>
                      <Text style={[styles.tabText, selectedCategory?.id === cat.id && { color: '#FFF' }]}>{cat.value}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.section}>
                <Text style={styles.label}>Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {colors.map((color) => (
                    <TouchableOpacity key={`col-tab-${color.id}`} style={[styles.colorBubble, selectedColor?.id === color.id && { borderColor: currentTheme.primary, borderWidth: 2.5 }, { backgroundColor: color.hex_code || '#FFF' }]} onPress={() => setSelectedColor(prev => prev?.id === color.id ? null : color)}>
                      {selectedColor?.id === color.id && <Check size={16} color={color.value.toLowerCase() === 'black' ? '#FFF' : currentTheme.primary} strokeWidth={4} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {widths.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.label}>Width</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {widths.map((w) => (
                      <TouchableOpacity key={`wid-tab-${w.id}`} style={[styles.widthTab, selectedWidth?.id === w.id && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]} onPress={() => setSelectedWidth(prev => prev?.id === w.id ? null : w)}>
                        <Text style={[styles.widthLabel, selectedWidth?.id === w.id && { color: '#FFF' }]}>{w.value}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <ScrollView contentContainerStyle={[styles.sizeList, { paddingBottom: 150 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                {!selectedCategory || !selectedColor ? (
                    <View style={styles.selectionMsg}><Text style={styles.selectionMsgText}>Select Category & Color</Text></View>
                ) : (
                    sizes.map((s, i) => renderSizeItem(s, i))
                )}
            </ScrollView>
          </View>
        )}
        <View style={[styles.checkoutFooter, { paddingBottom: Math.max(insets.bottom, 25) }]}>
          <View style={styles.footerData}>
             <View style={styles.basketBadge}><ShoppingBag size={12} color={currentTheme.primary} /><Text style={[styles.badgeText, { color: currentTheme.primary }]}>{getTotalItems()} ITEMS</Text></View>
            <Text style={styles.grandPrice}>Rs {totalPrice}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={[styles.mainBtn, { backgroundColor: currentTheme.primary, shadowColor: currentTheme.primary }]} onPress={() => getTotalItems() === 0 ? Alert.alert("Empty", "Select items.") : navigation.navigate('ConfirmOrder')}>
            <Text style={styles.btnText}>PROCEED</Text>
            <View style={styles.btnIcon}><ChevronRight size={20} color={currentTheme.primary} /></View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loaderText: { marginTop: 15, fontSize: 10, fontWeight: '900', color: '#CCC', letterSpacing: 2 },
  mainWrapper: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -40, overflow: 'hidden' },
  logoHeader: { alignItems: 'center', paddingTop: 60 },
  headerLogo: { width: 110, height: 110 },
  backWrapper: { position: 'absolute', top: 50, left: 20 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  configHeader: { paddingHorizontal: 20, paddingTop: 30 },
  section: { marginBottom: 25 },
  label: { fontSize: 10, fontWeight: '900', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
  tab: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 25, marginRight: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: '#EEE' },
  tabText: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  colorBubble: { width: 44, height: 44, borderRadius: 22, marginRight: 15, borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  widthTab: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, backgroundColor: COLORS.surface, marginRight: 12, borderWidth: 1, borderColor: '#EEE' },
  widthLabel: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  sizeList: { paddingHorizontal: 20 },
  sizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  sizeLabel: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  priceValue: { fontSize: 12, fontWeight: '900', color: COLORS.accent },
  outBadge: { marginLeft: 10, backgroundColor: COLORS.error + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  outText: { fontSize: 8, fontWeight: '900', color: COLORS.error },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
  quantityInput: { fontSize: 22, fontWeight: '900', width: 60, textAlign: 'center', paddingVertical: 12 },
  arrowStack: { borderLeftWidth: 1, borderLeftColor: '#EEE' },
  arrowButton: { paddingHorizontal: 12, paddingVertical: 4 },
  checkoutFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 25, flexDirection: 'row', alignItems: 'center', borderTopLeftRadius: 45, borderTopRightRadius: 45, elevation: 35, shadowColor: '#000', shadowOffset: { width: 0, height: -15 }, shadowOpacity: 0.15, shadowRadius: 20 },
  footerData: { flex: 1 },
  basketBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 5 },
  badgeText: { fontSize: 10, fontWeight: '900', marginLeft: 5 },
  grandPrice: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -1 },
  mainBtn: { flex: 1, marginLeft: 20, paddingLeft: 25, paddingRight: 8, paddingVertical: 8, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 15 },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  btnIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  styleGrid: { padding: 30, flex: 1 },
  gridTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 30, letterSpacing: -0.5 },
  styleCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 22, flexDirection: 'row', alignItems: 'center', marginBottom: 20, elevation: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  iconBox: { width: 60, height: 60, borderRadius: 22, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  styleName: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 2 },
  styleSub: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', opacity: 0.6 },
  miniArrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  selectionMsg: { padding: 40, alignItems: 'center' },
  selectionMsgText: { color: '#BBB', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }
});

export default SizeSelectionScreen;