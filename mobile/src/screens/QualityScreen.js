import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Animated,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  LogOut,
  ChevronRight,
  TrendingUp,
  RefreshCcw,
  Layers
} from 'lucide-react-native';
import api, { getImageUrl } from '../utils/api';
import { COLORS } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';

const QualityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((state) => state.logout);
  const [qualities, setQualities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const fadeAnims = useRef([]).current;
  const slideAnims = useRef([]).current;
  const scaleAnims = useRef([]).current;

  const fetchQualities = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/qualities', {
        timeout: 10000
      });

      const data = response.data;
      setQualities(data);
      
      data.forEach((_, i) => {
        fadeAnims[i] = new Animated.Value(0);
        slideAnims[i] = new Animated.Value(30);
        scaleAnims[i] = new Animated.Value(0.95);
      });

      const animations = data.map((_, i) => {
        return Animated.parallel([
          Animated.timing(fadeAnims[i], { toValue: 1, duration: 800, delay: i * 150, useNativeDriver: true }),
          Animated.spring(slideAnims[i], { toValue: 0, friction: 8, delay: i * 150, useNativeDriver: true }),
          Animated.spring(scaleAnims[i], { toValue: 1, friction: 8, delay: i * 150, useNativeDriver: true })
        ]);
      });
      Animated.stagger(100, animations).start();
    } catch (err) {
      setError("Unable to connect to server.");
    } finally {
      if (isRefreshing) setRefreshing(false);
      else setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQualities(true);
  };

  useEffect(() => {
    fetchQualities();
  }, []);

  const renderCard = (item, index) => {
    if (!fadeAnims[index]) return null;
    const hasImage = item.image_url && typeof item.image_url === 'string' && item.image_url.trim().length > 0;

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
          onPress={() => navigation.navigate('SizeSelection', { qualityId: item.id, qualityName: item.name })}
        >
          {item.tag ? (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          ) : null}
          <View style={styles.imageContainer}>
             {hasImage ? (
                <Image source={{ uri: getImageUrl(item.image_url) }} style={styles.cardImage} resizeMode="contain" />
             ) : (
                <Layers size={30} color={COLORS.accent} opacity={0.2} />
             )}
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
        <SafeAreaView style={styles.safeArea} edges={['right', 'left', 'top']}>
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <Image source={require('../../assets/images/madina-collar-round.png')} style={styles.headerLogo} resizeMode="contain" />
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
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          >
            <View style={styles.titleSection}>
              <View style={styles.trendBadge}>
                <TrendingUp size={12} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.trendText}>Top Quality Fabrics</Text>
              </View>
              <Text style={styles.mainTitle}>Collections</Text>
              <Text style={styles.subtitle}>Select from our handpicked premium range</Text>
            </View>

            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loaderText}>Syncing latest fabrics...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchQualities()}>
                  <RefreshCcw size={16} color="#FFF" />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : qualities.length === 0 ? (
              <View style={styles.centerContainer}>
                <Layers size={48} color={COLORS.textSecondary} style={{ opacity: 0.2, marginBottom: 15 }} />
                <Text style={styles.emptyText}>No fabrics found.</Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {qualities.map((item, index) => renderCard(item, index))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 10, paddingBottom: 25 },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 70, height: 70 },
  welcomeText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, opacity: 0.7 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  logoutButton: { backgroundColor: 'rgba(255,255,255,0.8)', padding: 12, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 4 },
  scrollContent: { paddingBottom: 40 },
  titleSection: { paddingHorizontal: 25, marginTop: 10, marginBottom: 25 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12, elevation: 5 },
  trendText: { color: '#FFF', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  mainTitle: { color: COLORS.textPrimary, fontSize: 42, fontWeight: '900', marginBottom: 4, letterSpacing: -1 },
  subtitle: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600', lineHeight: 22, opacity: 0.7 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  cardWrapper: { width: '48%', marginBottom: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 25, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', elevation: 15 },
  imageContainer: { width: '100%', height: 90, backgroundColor: COLORS.surface, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  tagBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, zIndex: 1, elevation: 2 },
  tagText: { fontSize: 8, fontWeight: '900', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 1 },
  cardImage: { width: '80%', height: '80%' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 5, paddingBottom: 2 },
  cardText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '900', letterSpacing: -0.2 },
  arrowIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  centerContainer: { padding: 80, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 15, color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold' },
  errorText: { color: COLORS.error, fontSize: 11, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: COLORS.textPrimary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  retryText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  emptyText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' }
});

export default QualityScreen;