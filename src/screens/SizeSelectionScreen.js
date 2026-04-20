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
      <LinearGradient colors={currentTheme.gradient} style={{ height: 210 }}>
        <View style={[styles.navHeader, { paddingTop: 95 }]}>
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
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[styles.headerTitle, { color: '#000' }]}>{selectedType ? `${selectedType}` : "Select Style"}</Text>
            <Text style={[styles.qualitySubheader, { color: currentTheme.accent }]}>{quality}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.mainContainer}>
        {!selectedType ? (
          <View style={styles.selectionGrid}>
            <Text style={styles.selectionTitle}>Choose Design Style</Text>
            {types.map((type, index) => (
              <Animated.View key={type.id} entering={FadeInDown.delay(index * 150)}>
                <TouchableOpacity style={styles.typeCard} onPress={() => setSelectedType(type.name)}>
                  <View style={styles.typeIconPlaceholder}>
                    {type.icon}
                  </View>
                  <Text style={styles.typeText}>{type.name}</Text>
                  <ChevronRight size={20} color={currentTheme.primary} />
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

            <FlatList
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
                  <Text style={[styles.summaryQty, { color: currentTheme.primary }]}>{item.qty} pcs</Text>
                  <TouchableOpacity onPress={() => removeItem(item.key, item.size)}><Trash2 size={18} color={COLORS.error} /></TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => totalInCart > 0 && setShowSummary(!showSummary)} style={styles.footerInfo}>
            <Text style={styles.footerLabel}>{totalInCart} Pieces {totalInCart > 0 && <ChevronUpIcon size={14} color={currentTheme.primary} />}</Text>
            <Text style={styles.footerValue}>Rs {totalPrice}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.confirmButton, { backgroundColor: currentTheme.primary, shadowColor: currentTheme.primary }]} onPress={() => navigation.navigate('ConfirmOrder')}>
            <ShoppingBag size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.confirmButtonText}>PROCEED</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  navHeader: { paddingHorizontal: 20, paddingTop: 20 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 10 },
  qualitySubheader: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  optionsHeader: { paddingHorizontal: 20, paddingTop: 20, backgroundColor: COLORS.background },
  selectorSection: { marginBottom: 15 },
  selectorLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  categoryTab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, marginRight: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: '#E0E0E0' },
  activeCategoryTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryTabText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  activeCategoryTabText: { color: '#FFF' },
  colorChip: { width: 40, height: 40, borderRadius: 20, marginRight: 15, borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  activeChip: { borderColor: COLORS.primary, borderWidth: 2 },
  dotIndicator: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, borderWidth: 1, borderColor: '#FFF' },
  widthChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.surface, marginRight: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  activeWidthChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  widthText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  activeWidthText: { color: '#FFF' },
  listPadding: { paddingHorizontal: 20, paddingBottom: 180 },
  sizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  sizeLabel: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  miniColorList: { flexDirection: 'row', marginTop: 6 },
  miniColorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 4, borderWidth: 0.5, borderColor: '#DDD' },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, paddingLeft: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  quantityInput: { fontSize: 18, fontWeight: '900', width: 50, textAlign: 'center', paddingVertical: 10 },
  arrowStack: { borderLeftWidth: 1, borderLeftColor: '#E0E0E0', paddingHorizontal: 6 },
  summaryTray: { position: 'absolute', bottom: 100, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, zIndex: 100 },
  trayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  trayTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary },
  summaryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  summaryText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  summaryQty: { fontWeight: '900', marginRight: 15, color: COLORS.primary, fontSize: 15 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 15 },
  footerLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  footerValue: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900' },
  confirmButton: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', elevation: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  confirmButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  selectionGrid: { padding: 25, flex: 1 },
  selectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 25, textAlign: 'left', letterSpacing: 0.5 },
  typeCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 },
  typeIconPlaceholder: { width: 60, height: 60, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  typeText: { fontSize: 18, fontWeight: '900', flex: 1, color: COLORS.textPrimary },
  changeTypeButton: { backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 15, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#EEE' },
  changeTypeText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '800' },
});

export default SizeSelectionScreen;