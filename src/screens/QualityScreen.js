import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  LogOut,
  ChevronRight,
  TrendingUp
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';

const ANARKALI = require('../../assets/images/anarkali.jpg');
const ANGLE = require('../../assets/images/angle.jpg');
const PAK = require('../../assets/images/pak.jpg');
const MADINA_COLLAR = require('../../assets/images/madina-collar.jpg');
const NEW_MADINA_COLLAR = require('../../assets/images/new-madina-collar.png');

const QUALITIES = [
  { id: '1', name: 'Madina Collar', image: MADINA_COLLAR, tag: 'Premium' },
  { id: '2', name: 'New Madina Collar', image: NEW_MADINA_COLLAR, tag: '' },
  { id: '3', name: 'Anarkali Collar', image: ANARKALI, tag: '' },
  { id: '4', name: 'Angle Collar', image: ANGLE, tag: '' },
  { id: '5', name: 'Pak Collar', image: PAK, tag: '' },
];

const QualityScreen = ({ navigation }) => {
  const logout = useAuthStore((state) => state.logout);
  const fadeAnims = useRef(QUALITIES.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(QUALITIES.map(() => new Animated.Value(30))).current;

  useEffect(() => {
    const animations = QUALITIES.map((_, i) => {
      return Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 600,
          delay: i * 150,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnims[i], {
          toValue: 0,
          friction: 6,
          delay: i * 150,
          useNativeDriver: true,
        })
      ]);
    });
    Animated.stagger(100, animations).start();
  }, []);

  const renderCard = (item, index) => {
    return (
      <Animated.View 
        key={item.id}
        style={[
          styles.cardWrapper,
          { 
            opacity: fadeAnims[index],
            transform: [{ translateY: slideAnims[index] }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('SizeSelection', { quality: item.name })}
        >
          {item.tag ? (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          ) : null}
          <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
          <View style={styles.cardFooter}>
            <Text style={styles.cardText} numberOfLines={1}>{item.name}</Text>
            <ChevronRight size={16} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={COLORS.yellowGradient} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.header, { paddingTop: 40 }]}>
            <View>
              <Text style={styles.welcomeText}>Welcome to</Text>
              <Text style={styles.headerTitle}>MADINA COLLAR</Text>
            </View>
            <TouchableOpacity onPress={() => logout()} style={styles.logoutButton}>
              <LogOut size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleSection}>
              <View style={styles.trendBadge}>
                <TrendingUp size={14} color="#FFF" style={{ marginRight: 5 }} />
                <Text style={styles.trendText}>Top Quality Fabrics</Text>
              </View>
              <Text style={styles.mainTitle}>Collections</Text>
              <Text style={styles.subtitle}>Select from our handpicked premium range</Text>
            </View>

            <View style={styles.gridContainer}>
              {QUALITIES.map((item, index) => renderCard(item, index))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  welcomeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleSection: {
    paddingHorizontal: 25,
    marginTop: 10,
    marginBottom: 20,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  trendText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  mainTitle: {
    color: COLORS.textPrimary,
    fontSize: 38,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tagBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  cardImage: {
    width: 80,
    height: 80,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 5,
    paddingHorizontal: 5,
  },
  cardText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
});

export default QualityScreen;