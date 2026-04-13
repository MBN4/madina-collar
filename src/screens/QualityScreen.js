import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { 
  LogOut 
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';

const ANARKALI = require('../../assets/images/anarkali.jpg');
const ANGLE = require('../../assets/images/angle.jpg');
const PAK = require('../../assets/images/pak.jpg');
const MADINA_COLLAR = require('../../assets/images/madina-collar.jpg');

const QUALITIES = [
  { id: '1', name: 'Madina Collar', image: MADINA_COLLAR },
  { id: '2', name: 'New Madina Collar', image: MADINA_COLLAR },
  { id: '3', name: 'Anarkali', image: ANARKALI },
  { id: '4', name: 'Angle', image: ANGLE },
  { id: '5', name: 'Pakistani', image: PAK },
];

const QualityScreen = ({ navigation }) => {
  const logout = useAuthStore((state) => state.logout);

  const renderCard = (item) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => navigation.navigate('SizeSelection', { quality: item.name })}
      >
        <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
        <Text style={styles.cardText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>COLLECTIONS</Text>
        <TouchableOpacity onPress={() => logout()}>
          <LogOut size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Select Quality</Text>
          <Text style={styles.subtitle}>Handpicked fabrics for excellence</Text>
        </View>

        <View style={styles.gridContainer}>
          {QUALITIES.map(renderCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 15,
    height: 60,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  mainTitle: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    opacity: 0.8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 15,
    gap: 15,
  },
  card: {
    backgroundColor: COLORS.background,
    width: '46%',
    aspectRatio: 0.9,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  cardText: {
    color: COLORS.textPrimary,
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QualityScreen;