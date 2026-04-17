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
import Animated, { FadeInDown, Layout, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { ChevronLeft, ChevronUp, ChevronDown, ShoppingBag, Check, Trash2, ChevronUp as ChevronUpIcon } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
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
    { id: 'Collar', name: 'Collar' },
    { id: 'Bain', name: 'Bain' },
    { id: 'Roll Patti', name: 'Roll Patti' },
  ];

  const handleManualInput = (size, text) => {
    const newVal = parseInt(text.replace(/[^0-9]/g, '')) || 0;
    const currentQty = currentConfigCart[size] || 0;
    updateQuantity(cartKey, size, newVal - currentQty);
  };

  const renderSizeItem = ({ item: size }) => {
    const quantity = currentConfigCart[size] || 0;
    const activeColors = colorsForSize(size);

    return (
      <Animated.View layout={Layout.springify()} style={styles.sizeRow}>
        <View>
          <Text style={styles.sizeLabel}>{size}</Text>
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
              <ChevronUp size={18} color={COLORS.primary} strokeWidth={3} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => updateQuantity(cartKey, size, -1)} style={styles.arrowButton}>
              <ChevronDown size={18} color={COLORS.primary} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={COLORS.textPrimary} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedType ? `${quality} - ${selectedType}` : quality}</Text>
          <View style={{ width: 40 }} />
        </View>

        {!selectedType ? (
          <View style={styles.selectionGrid}>
            <Text style={styles.selectionTitle}>Choose Design Style</Text>
            {types.map((type) => (
              <TouchableOpacity key={type.id} style={styles.typeCard} onPress={() => setSelectedType(type.name)}>
                <View style={styles.typeIconPlaceholder}><Text style={styles.typeInitial}>{type.name.charAt(0)}</Text></View>
                <Text style={styles.typeText}>{type.name}</Text>
                <ChevronUp size={20} color="#E0E0E0" style={{ transform: [{ rotate: '90deg' }], marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.optionsHeader}>
              <TouchableOpacity style={styles.changeTypeButton} onPress={() => setSelectedType(null)}>
                <Text style={styles.changeTypeText}>← Change Style ({selectedType})</Text>
              </TouchableOpacity>

              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Select Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORY_MAP[selectedType].map((cat) => (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => setSelectedCategory(cat)}
                      style={[styles.categoryTab, selectedCategory === cat && styles.activeCategoryTab]}
                    >
                      <Text style={[styles.categoryTabText, selectedCategory === cat && styles.activeCategoryTabText]}>{cat}</Text>
                      {hasItemsInCategory(cat) && <View style={styles.dotIndicator} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Select Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {colors.map((color) => (
                    <TouchableOpacity
                      key={color.id}
                      style={[styles.colorChip, selectedColor.id === color.id && styles.activeChip, { backgroundColor: color.hex }]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor.id === color.id && <Check size={14} color={(color.id === 'black') ? '#FFF' : COLORS.primary} strokeWidth={4} />}
                      {hasItemsInColor(color.name) && <View style={[styles.dotIndicator, (color.id === 'black') && { borderColor: '#555' }]} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {WIDTH_MAP[selectedType] && (
                <View style={styles.selectorSection}>
                  <Text style={styles.selectorLabel}>Select Width</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {WIDTH_MAP[selectedType].map((width) => (
                      <TouchableOpacity
                        key={width}
                        style={[styles.widthChip, selectedWidth === width && styles.activeWidthChip]}
                        onPress={() => setSelectedWidth(width)}
                      >
                        <Text style={[styles.widthText, selectedWidth === width && styles.activeWidthText]}>{width}</Text>
                        {hasItemsInWidth(width) && <View style={[styles.dotIndicator, { backgroundColor: selectedWidth === width ? '#FFF' : COLORS.primary }]} />}
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
                  <Text style={styles.summaryQty}>{item.qty} pcs</Text>
                  <TouchableOpacity onPress={() => removeItem(item.key, item.size)}><Trash2 size={18} color={COLORS.error} /></TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => totalInCart > 0 && setShowSummary(!showSummary)} style={styles.footerInfo}>
            <Text style={styles.footerLabel}>{totalInCart} Pieces {totalInCart > 0 && <ChevronUpIcon size={14} color={COLORS.primary} />}</Text>
            <Text style={styles.footerValue}>Rs {totalPrice}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={() => navigation.navigate('ConfirmOrder')}>
            <ShoppingBag size={20} color={COLORS.secondary} style={{ marginRight: 10 }} />
            <Text style={styles.confirmButtonText}>PROCEED</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  mainContainer: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 60 },
  headerTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' },
  optionsHeader: { paddingHorizontal: 20, paddingTop: 10, backgroundColor: COLORS.background },
  selectorSection: { marginBottom: 15 },
  selectorLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryTab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#F5F5F7', borderWidth: 1, borderColor: '#E0E0E0' },
  activeCategoryTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryTabText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  activeCategoryTabText: { color: '#FFF' },
  colorChip: { width: 38, height: 38, borderRadius: 19, marginRight: 15, borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  activeChip: { borderColor: COLORS.primary, borderWidth: 2 },
  dotIndicator: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, borderWidth: 1, borderColor: '#FFF' },
  widthChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F7', marginRight: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  activeWidthChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  widthText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  activeWidthText: { color: COLORS.secondary },
  listPadding: { paddingHorizontal: 20, paddingBottom: 180 },
  sizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sizeLabel: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  miniColorList: { flexDirection: 'row', marginTop: 4 },
  miniColorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4, borderWidth: 0.5, borderColor: '#DDD' },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, paddingLeft: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  quantityInput: { fontSize: 16, fontWeight: 'bold', width: 45, textAlign: 'center', paddingVertical: 8 },
  arrowStack: { borderLeftWidth: 1, borderLeftColor: '#E0E0E0', paddingHorizontal: 4 },
  summaryTray: { position: 'absolute', bottom: 100, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, elevation: 25, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, zIndex: 100 },
  trayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  trayTitle: { fontWeight: 'bold', color: COLORS.textPrimary },
  summaryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  summaryText: { flex: 1, fontSize: 12, color: COLORS.textPrimary },
  summaryQty: { fontWeight: 'bold', marginRight: 15, color: COLORS.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20 },
  footerValue: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold' },
  confirmButton: { backgroundColor: COLORS.primary, paddingHorizontal: 25, paddingVertical: 15, borderRadius: 18, flexDirection: 'row', alignItems: 'center' },
  confirmButtonText: { color: COLORS.secondary, fontWeight: '900' },
  selectionGrid: { padding: 20, flex: 1 },
  selectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 20, textAlign: 'center' },
  typeCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0', elevation: 3 },
  typeIconPlaceholder: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#FFF9EF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  typeInitial: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  typeText: { fontSize: 16, fontWeight: '700' },
  changeTypeButton: { backgroundColor: '#F8F9FA', padding: 8, borderRadius: 8, marginBottom: 15, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#EEE' },
  changeTypeText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
});

export default SizeSelectionScreen;