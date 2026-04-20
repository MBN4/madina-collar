import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Image,
  Platform,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, Layout, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShoppingBag, Check, Trash2, ChevronUp as ChevronUpIcon, Ruler, Palette, Layers } from 'lucide-react-native';
import { COLORS, QUALITY_THEMES } from '../theme/colors';
import { useCartStore } from '../store/useCartStore';

const generateDefaultSizes = () => {
  const sizes = [];
  for (let i = 10; i <= 22; i += 0.5) {
    sizes.push(i.toString());
  }
  return sizes;
};

const DEFAULT_SIZES = generateDefaultSizes();

const WIDTH_MAP = {
  'Collar': ['2', '2 1/4', '2 1/2', '2 3/4', '3'],
  'Bain': ['3/4', '1', '1 1/4'],
};

const CATEGORY_MAP = {
  'Collar': ['Classic', 'French'],
  'Bain': ['Classic Shape', 'JJ Shape', 'Waistcoat Shape'],
  'Roll Patti': ['100 meter']
};

const COLOR_OPTIONS_MAP = {
  'default': [
    { id: 'white', name: 'White', label: 'White', hex: '#FFFFFF' },
    { id: 'offwhite', name: 'offwhite', label: 'Cream collar', hex: '#FAF9F6' },
    { id: 'black', name: 'Black', label: 'Black', hex: '#000000' },
  ],
  'Roll Patti': [
    { id: 'whitecollar', name: 'White collar', label: 'White collar', hex: '#FFFFFF' },
    { id: 'black', name: 'Black', label: 'Black', hex: '#000000' },
  ]
};

const ROLL_PATTI_LENGTHS = {
  'White collar': ['3/4', '7 suttar', '1', '9 suttar', '1 1/4', '1 1/2', '2 1/4', '2 1/2', '2 3/4', '3'],
  'Black': ['3/4', '1', '1 1/4', '1 1/2', '2 1/2']
};

const UNIT_PRICE = 45;

const SizeSelectionScreen = ({ route, navigation }) => {
  const { quality } = route.params;
  const currentTheme = QUALITY_THEMES[quality] || QUALITY_THEMES['Madina Collar'];
  const { cart, updateQuantity, removeItem, getTotalItems } = useCartStore();
  
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWidth, setSelectedWidth] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS_MAP.default[0]);
  const [showSummary, setShowSummary] = useState(false);

  const colors = selectedType === 'Roll Patti' ? COLOR_OPTIONS_MAP['Roll Patti'] : COLOR_OPTIONS_MAP.default;

  useEffect(() => {
    if (selectedType) {
      const firstCat = CATEGORY_MAP[selectedType][0];
      setSelectedCategory(firstCat);
      setSelectedWidth(WIDTH_MAP[selectedType] ? WIDTH_MAP[selectedType][0] : '');
      
      const availableColors = selectedType === 'Roll Patti' ? COLOR_OPTIONS_MAP['Roll Patti'] : COLOR_OPTIONS_MAP.default;
      const isCurrentColorAvailable = availableColors.some(c => c.name === selectedColor.name);
      if (!isCurrentColorAvailable) {
        setSelectedColor(availableColors[0]);
      }
    }
  }, [selectedType]);

  const activeSizes = useMemo(() => {
    if (selectedType !== 'Roll Patti') return DEFAULT_SIZES;
    return ROLL_PATTI_LENGTHS[selectedColor.name] || ROLL_PATTI_LENGTHS['White collar'];
  }, [selectedType, selectedColor]);

  const cartKey = `${quality}|${selectedType}|${selectedCategory}|${selectedColor.name}${selectedWidth ? `|${selectedWidth}` : ''}`;
  const currentConfigCart = cart[cartKey] || {};
  const totalInCart = getTotalItems();
  const totalPrice = totalInCart * UNIT_PRICE;

  const cartItemsList = useMemo(() => {
    const items = [];
    Object.entries(cart).forEach(([key, sizes]) => {
      if (key.startsWith(`${quality}|${selectedType}`)) {
        const parts = key.split('|');
        const cat = parts[2];
        const colorName = parts[3];
        const width = parts[4] || null;

        const colorObj = [...COLOR_OPTIONS_MAP.default, ...COLOR_OPTIONS_MAP['Roll Patti']].find(c => c.name === colorName);
        const colorLabel = colorObj ? colorObj.label : colorName;

        Object.entries(sizes).forEach(([size, qty]) => {
          items.push({ key, size, qty, colorLabel, colorHex: colorObj?.hex, width, category: cat });
        });
      }
    });
    return items;
  }, [cart, quality, selectedType]);

  const hasItemsInColor = (colorName) => {
    return Object.keys(cart).some(key => key.includes(`|${selectedType}|${selectedCategory}|${colorName}`));
  };

  const hasItemsInWidth = (width) => {
    return Object.keys(cart).some(key => key.includes(`|${selectedType}|${selectedCategory}|`) && key.endsWith(`|${width}`));
  };

  const hasItemsInCategory = (catName) => {
    return Object.keys(cart).some(key => key.startsWith(`${quality}|${selectedType}|${catName}`));
  };

  const colorsForSize = (size) => {
    const activeColorsList = [];
    colors.forEach(c => {
      const k = `${quality}|${selectedType}|${selectedCategory}|${c.name}${selectedWidth ? `|${selectedWidth}` : ''}`;
      if (cart[k]?.[size] > 0) activeColorsList.push(c.hex);
    });
    return activeColorsList;
  };

  const types = [
    { id: 'Collar', name: 'Collar', icon: <Layers size={24} color={currentTheme.primary} /> },
    { id: 'Bain', name: 'Bain', icon: <Ruler size={24} color={currentTheme.primary} /> },
    { id: 'Roll Patti', name: 'Roll Patti', icon: <Palette size={24} color={currentTheme.primary} /> },
  ];

  const handleManualInput = (size, text) => {
    const newVal = parseInt(text.replace(/[^0-9]/g, '')) || 0;
    const currentQty = currentConfigCart[size] || 0;
    updateQuantity(cartKey, size, newVal - currentQty);
  };

  const renderSizeItem = ({ item: size, index }) => {
    const quantity = currentConfigCart[size] || 0;
    const activeColors = colorsForSize(size);

    return (
      <Animated.View 
        entering={FadeInRight.delay(index * 30)}
        layout={Layout.springify()} 
        style={styles.sizeRow}
      >
        <View>
          <Text style={styles.sizeLabel}>Size {size}</Text>
          <View style={styles.miniColorList}>
            {activeColors.map((hex, idx) => (
              <View key={idx} style={[styles.miniColorDot, { backgroundColor: hex }]} />
            ))}
          </View>
        </View>
        <View style={styles.controlsContainer}>
          <TextInput
            style={styles.quantityInput}
            value={quantity.toString()}
            onChangeText={(text) => handleManualInput(size, text)}
            keyboardType="number-pad"
            color={COLORS.textPrimary}
          />
          <View style={styles.arrowStack}>
            <TouchableOpacity onPress={() => updateQuantity(cartKey, size, 1)} style={styles.arrowButton}>
              <ChevronUp size={18} color={currentTheme.primary} strokeWidth={3} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => updateQuantity(cartKey, size, -1)} style={styles.arrowButton}>
              <ChevronDown size={18} color={currentTheme.primary} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={currentTheme.gradient} style={{ height: 240 }}>
        <View style={styles.logoHeader}>
           <Image source={require('../../assets/images/madina-collar-round.png')} style={styles.headerLogo} resizeMode="contain" />
        </View>
        <View style={[styles.navHeader, { marginTop: -80, paddingBottom: 10 }]}>
          <TouchableOpacity 
            onPress={() => {
              if (selectedType) setSelectedType(null);
              else navigation.goBack();
            }} 
            style={styles.backButton}
          >
            <View style={styles.iconCircle}>
              <ChevronLeft color={COLORS.textPrimary} size={24} />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.mainContainer}>
        {!selectedType ? (
          <View style={styles.selectionGrid}>
            <Text style={styles.selectionTitle}>Choose Design Style</Text>
            {types.map((type, index) => (
              <Animated.View 
                key={type.id} 
                entering={FadeInDown.delay(index * 150).springify()}
              >
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={styles.typeCard} 
                  onPress={() => setSelectedType(type.name)}
                >
                  <View style={styles.typeIconPlaceholder}>
                    {type.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.typeText}>{type.name}</Text>
                     <Text style={styles.typeSubText}>Browse {type.name} collection</Text>
                  </View>
                  <View style={[styles.arrowCircle, { backgroundColor: currentTheme.primary + '20' }]}>
                    <ChevronRight size={18} color={currentTheme.primary} strokeWidth={3} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.optionsHeader}>
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORY_MAP[selectedType].map((cat) => (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => setSelectedCategory(cat)}
                      style={[styles.categoryTab, selectedCategory === cat && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                    >
                      <Text style={[styles.categoryTabText, selectedCategory === cat && styles.activeCategoryTabText]}>{cat}</Text>
                      {hasItemsInCategory(cat) && <View style={[styles.dotIndicator, { backgroundColor: currentTheme.primary }]} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {colors.map((color) => (
                    <TouchableOpacity
                      key={color.id}
                      style={[styles.colorChip, selectedColor.id === color.id && { borderColor: currentTheme.primary, borderWidth: 2 }, { backgroundColor: color.hex }]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor.id === color.id && <Check size={14} color={(color.id === 'black') ? '#FFF' : currentTheme.primary} strokeWidth={4} />}
                      {hasItemsInColor(color.name) && <View style={[styles.dotIndicator, { backgroundColor: currentTheme.primary }, (color.id === 'black') && { borderColor: '#555' }]} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {WIDTH_MAP[selectedType] && (
                <View style={styles.selectorSection}>
                  <Text style={styles.selectorLabel}>Width</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {WIDTH_MAP[selectedType].map((width) => (
                      <TouchableOpacity
                        key={width}
                        style={[styles.widthChip, selectedWidth === width && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                        onPress={() => setSelectedWidth(width)}
                      >
                        <Text style={[styles.widthText, selectedWidth === width && styles.activeWidthText]}>{width}</Text>
                        {hasItemsInWidth(width) && <View style={[styles.dotIndicator, { backgroundColor: selectedWidth === width ? '#FFF' : currentTheme.primary }]} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <Animated.FlatList
              entering={FadeInDown}
              data={activeSizes}
              keyExtractor={(item) => item}
              renderItem={renderSizeItem}
              contentContainerStyle={styles.listPadding}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {totalInCart > 0 && showSummary && (
          <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={styles.summaryTray}>
            <View style={styles.trayHeader}>
              <Text style={styles.trayTitle}>Current Selection Summary</Text>
              <TouchableOpacity onPress={() => setShowSummary(false)}><ChevronDown color={COLORS.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {cartItemsList.map((item, idx) => (
                <Animated.View entering={FadeInDown.delay(idx * 30)} key={`${item.key}-${item.size}`} style={styles.summaryItem}>
                  <View style={[styles.miniColorDot, { backgroundColor: item.colorHex, marginRight: 10 }]} />
                  <Text style={styles.summaryText}>{item.category} • {item.size} • {item.colorLabel} {item.width ? `• W: ${item.width}` : ''}</Text>
                  <View style={{ alignItems: 'flex-end', marginRight: 15 }}>
                    <Text style={[styles.summaryQty, { color: currentTheme.primary }]}>{item.qty} pcs</Text>
                    <Text style={styles.summaryItemPrice}>Rs {item.qty * UNIT_PRICE}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(item.key, item.size)} style={styles.removeButton}><Trash2 size={16} color={COLORS.error} /></TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => totalInCart > 0 && setShowSummary(!showSummary)} style={styles.footerInfo}>
             <View style={styles.totalBadge}>
                <ShoppingBag size={12} color={currentTheme.primary} />
                <Text style={[styles.totalBadgeText, { color: currentTheme.primary }]}>{totalInCart} items</Text>
             </View>
            <Text style={styles.footerValue}>Rs {totalPrice}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.confirmButton, { backgroundColor: currentTheme.primary, shadowColor: currentTheme.primary }]} 
            onPress={() => {
              if (totalInCart === 0) {
                Alert.alert("Empty Selection", "Please add at least one item before proceeding.");
              } else {
                navigation.navigate('ConfirmOrder');
              }
            }}
          >
            <Text style={styles.confirmButtonText}>PROCEED</Text>
            <View style={styles.confirmIconBox}>
               <ChevronRight size={20} color={currentTheme.primary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: -35 },
  logoHeader: { alignItems: 'center', paddingTop: 60, height: 140 },
  headerLogo: { width: 80, height: 80 },
  navHeader: { paddingHorizontal: 25, flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  qualitySubheader: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 },
  optionsHeader: { paddingHorizontal: 20, paddingTop: 25, backgroundColor: COLORS.background },
  selectorSection: { marginBottom: 20 },
  selectorLabel: { fontSize: 12, fontWeight: '900', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.5 },
  categoryTab: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, marginRight: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: '#F0F0F0' },
  categoryTabText: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  activeCategoryTabText: { color: '#FFF' },
  colorChip: { width: 44, height: 44, borderRadius: 22, marginRight: 15, borderWidth: 2, borderColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  dotIndicator: { position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#FFF' },
  widthChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 15, backgroundColor: COLORS.surface, marginRight: 12, borderWidth: 1.5, borderColor: '#F0F0F0' },
  widthText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  activeWidthText: { color: '#FFF' },
  listPadding: { paddingHorizontal: 20, paddingBottom: 200, paddingTop: 10 },
  sizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  sizeLabel: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  miniColorList: { flexDirection: 'row', marginTop: 8 },
  miniColorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 15, paddingLeft: 12, borderWidth: 1.5, borderColor: '#F0F0F0' },
  quantityInput: { fontSize: 20, fontWeight: '900', width: 55, textAlign: 'center', paddingVertical: 12 },
  arrowStack: { borderLeftWidth: 1.5, borderLeftColor: '#F0F0F0' },
  arrowButton: { paddingHorizontal: 10, paddingVertical: 4 },
  summaryTray: { position: 'absolute', bottom: 110, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, elevation: 35, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 25, zIndex: 100 },
  trayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  trayTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary },
  summaryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  summaryText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontWeight: '700' },
  summaryQty: { fontWeight: '900', color: COLORS.primary, fontSize: 16 },
  summaryItemPrice: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  removeButton: { padding: 8, backgroundColor: '#FFF0F0', borderRadius: 10 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 40, borderTopRightRadius: 40, elevation: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20 },
  footerInfo: { flex: 1 },
  totalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor:  COLORS.surface, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 5 },
  totalBadgeText: { fontSize: 11, fontWeight: '900', marginLeft: 5, textTransform: 'uppercase' },
  footerValue: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '900' },
  confirmButton: { flex: 1, marginLeft: 20, paddingLeft: 25, paddingRight: 8, paddingVertical: 8, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 15, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  confirmButtonText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },
  confirmIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  selectionGrid: { padding: 25, flex: 1 },
  selectionTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 25, letterSpacing: -0.5 },
  typeCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12 },
  typeIconPlaceholder: { width: 64, height: 64, borderRadius: 22, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginRight: 18, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  typeText: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 2 },
  typeSubText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', opacity: 0.6 },
  arrowCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});

export default SizeSelectionScreen;