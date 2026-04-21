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
  const scaleAnims = useRef(QUALITIES.map(() => new Animated.Value(0.95))).current;

  useEffect(() => {
    const animations = QUALITIES.map((_, i) => {
      return Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 800,
          delay: i * 150,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnims[i], {
          toValue: 0,
          friction: 8,
          delay: i * 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[i], {
          toValue: 1,
          friction: 8,
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
            transform: [
              { translateY: slideAnims[index] },
              { scale: scaleAnims[index] }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SizeSelection', { quality: item.name })}
        >
          {item.tag ? (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          ) : null}
          <View style={styles.imageContainer}>
             <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
          </View>
          <View style={styles.cardFooter}>
            <View style={{ flex: 1 }}>
               <Text style={styles.cardText} numberOfLines={1}>{item.name}</Text>
            </View>
            <View style={styles.arrowIcon}>
               <ChevronRight size={14} color="#FFF" strokeWidth={4} />
            </View>
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
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <Image 
                source={require('../../assets/images/madina-collar-round.png')} 
                style={styles.headerLogo} 
                resizeMode="contain" 
              />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.welcomeText}>WELCOME TO</Text>
                <Text style={styles.headerTitle}>MADINA COLLAR</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => logout()} style={styles.logoutButton}>
              <LogOut size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleSection}>
              <View style={styles.trendBadge}>
                <TrendingUp size={12} color="#FFF" style={{ marginRight: 6 }} />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 80 : 50,
    paddingBottom: 25,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 70,
    height: 70,
  },
  welcomeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleSection: {
    paddingHorizontal: 25,
    marginTop: 10,
    marginBottom: 25,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    elevation: 5,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  trendText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainTitle: {
    color: COLORS.textPrimary,
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -1,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    opacity: 0.7,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  imageContainer: {
    width: '100%',
    height: 90,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardImage: {
    width: '80%',
    height: '80%',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
    paddingBottom: 2,
  },
  cardText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  arrowIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  }
});

export default QualityScreen;