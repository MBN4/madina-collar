import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Auth');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Changed from Image to Text to stop the 'File Not Found' error */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={styles.logoText}>BYA</Text>
        <View style={styles.line} />
        <Text style={styles.brandName}>PREMIUM APPAREL</Text>
      </Animated.View>
      
      <View style={styles.footerLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 60,
    fontWeight: '900',
    color: COLORS.primary, // Gold
    letterSpacing: 5,
  },
  brandName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 8,
    marginTop: 10,
  },
  line: {
    width: 100,
    height: 1,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  footerLine: {
    position: 'absolute',
    bottom: 50,
    width: 40,
    height: 2,
    backgroundColor: COLORS.primary,
  }
});

export default SplashScreen;