import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import { 
  Diamond, 
  Crown, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  LogOut 
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const QUALITIES = [
  { id: '1', name: 'Premium Silk', icon: Diamond },
  { id: '2', name: 'Royal Cotton', icon: Crown },
  { id: '3', name: 'Elite Blend', icon: ShieldCheck },
  { id: '4', name: 'Signature', icon: Sparkles },
  { id: '5', name: 'Masterpiece', icon: Award },
];

const QualityScreen = ({ navigation }) => {
  const renderCard = (item) => {
    const IconComponent = item.icon;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => navigation.navigate('SizeSelection', { quality: item.name })}
      >
        <IconComponent size={42} color={COLORS.primary} strokeWidth={1.5} />
        <Text style={styles.cardText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>COLLECTIONS</Text>
        <TouchableOpacity onPress={() => navigation.replace('Auth')}>
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
    backgroundColor: COLORS.surface,
    width: '46%',
    aspectRatio: 0.9,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  cardText: {
    color: COLORS.textPrimary,
    marginTop: 18,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QualityScreen;