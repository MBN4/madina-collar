import React, { useState } from 'react';
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
  StatusBar
} from 'react-native';
import { ChevronLeft, ChevronUp, ChevronDown, ShoppingBag } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useCartStore } from '../store/useCartStore';

const SIZES = Array.from({ length: 11 }, (_, i) => (i + 12).toString());
const UNIT_PRICE = 45; 

const SizeSelectionScreen = ({ route, navigation }) => {
  const { quality } = route.params;
  const { cart, updateQuantity, getTotalItems } = useCartStore();
  const [selectedType, setSelectedType] = useState(null);
  
  const cartKey = selectedType ? `${quality} - ${selectedType}` : quality;
  const currentQualityCart = cart[cartKey] || {};
  const totalInCart = getTotalItems();
  const totalPrice = totalInCart * UNIT_PRICE;

  const types = [
    { id: 'collar', name: 'Collar', icon: 'Shirt' },
    { id: 'bain', name: 'Bain', icon: 'User' },
    { id: 'roll_patti', name: 'Roll Patti', icon: 'Layers' },
  ];

  const handleManualInput = (size, text) => {
    const newVal = parseInt(text.replace(/[^0-9]/g, '')) || 0;
    const currentQty = currentQualityCart[size] || 0;
    const delta = newVal - currentQty;
    updateQuantity(cartKey, size, delta);
  };

  const renderSizeItem = ({ item: size }) => {
    const quantity = currentQualityCart[size] || 0;

    return (
      <View style={styles.sizeRow}>
        <Text style={styles.sizeLabel}>Size {size}</Text>
        
        <View style={styles.controlsContainer}>
          <TextInput
            style={styles.quantityInput}
            value={quantity.toString()}
            onChangeText={(text) => handleManualInput(size, text)}
            keyboardType="number-pad"
            color={COLORS.textPrimary}
            selectionColor={COLORS.primary}
            underlineColorAndroid="transparent"
          />
          
          <View style={styles.arrowStack}>
            <TouchableOpacity 
              onPress={() => updateQuantity(cartKey, size, 1)}
              style={styles.arrowButton}
            >
              <ChevronUp size={18} color={COLORS.primary} strokeWidth={3} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => updateQuantity(cartKey, size, -1)}
              style={styles.arrowButton}
            >
              <ChevronDown size={18} color={COLORS.primary} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={COLORS.textPrimary} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {selectedType ? `${quality} - ${selectedType}` : quality}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://img.freepik.com/premium-photo/white-shirt-collar-detail-high-end-fashion_1102473-100.jpg' }} 
            style={styles.collarImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
        </View>

        {!selectedType ? (
          <View style={styles.selectionGrid}>
            <Text style={styles.selectionTitle}>Choose Design Style</Text>
            <View style={styles.typeCardsContainer}>
              {types.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.typeCard}
                  onPress={() => setSelectedType(type.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.typeIconPlaceholder}>
                    <Text style={styles.typeInitial}>{type.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.typeText}>{type.name}</Text>
                  <View style={styles.chevronPlaceholder}>
                    <ChevronUp size={20} color="#E0E0E0" style={{ transform: [{ rotate: '90deg' }] }} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            data={SIZES}
            keyExtractor={(item) => item}
            renderItem={renderSizeItem}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            style={styles.list}
            removeClippedSubviews={false}
            ListHeaderComponent={() => (
              <TouchableOpacity 
                style={styles.changeTypeButton} 
                onPress={() => setSelectedType(null)}
              >
                <Text style={styles.changeTypeText}>← Change Selection ({selectedType})</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>{totalInCart} Pieces</Text>
            <Text style={styles.footerValue}>Rs {totalPrice}</Text>
          </View>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => navigation.navigate('ConfirmOrder')}
          >
            <ShoppingBag size={20} color={COLORS.secondary} style={{ marginRight: 10 }} />
            <Text style={styles.confirmButtonText}>PROCEED</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  mainContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  navHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    height: 60,
    zIndex: 10
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: { 
    color: COLORS.primary, 
    fontSize: 18, 
    fontWeight: 'bold', 
    letterSpacing: 1 
  },
  imageContainer: { 
    height: 160, 
    width: '100%', 
    position: 'relative'
  },
  collarImage: { width: '100%', height: '100%' },
  imageOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(255,255,255,0.7)' 
  },
  list: {
    flex: 1,
  },
  listPadding: { 
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 140 
  },
  sizeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  sizeLabel: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '600' },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  quantityInput: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'center',
    paddingVertical: 8,
    ...Platform.select({
      web: { outlineStyle: 'none' }
    })
  },
  arrowStack: {
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    paddingHorizontal: 5,
  },
  arrowButton: {
    padding: 2,
  },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface, 
    padding: 25, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  footerLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  footerValue: { color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold' },
  confirmButton: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 25, 
    paddingVertical: 15, 
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center'
  },
  confirmButtonText: { color: COLORS.secondary, fontWeight: '900', letterSpacing: 1 },
  selectionGrid: {
    padding: 20,
    flex: 1,
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  typeCardsContainer: {
    paddingTop: 10,
  },
  chevronPlaceholder: {
    marginLeft: 'auto',
  },
  typeIconPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFF9EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  typeInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  typeText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  changeTypeButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  changeTypeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default SizeSelectionScreen;