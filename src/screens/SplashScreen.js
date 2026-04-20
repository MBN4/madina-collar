import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

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
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Auth');
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '0deg']
  });

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient
        colors={COLORS.premiumGradient}
        style={styles.container}
      >
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [
            { scale: scaleAnim },
            { rotate: spin },
            { translateY: slideUp }
          ], 
          alignItems: 'center' 
        }}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../../assets/images/madina-collar-round.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Animated.View style={[styles.glow, { opacity: fadeAnim }]} />
        </Animated.View>
        
        <Animated.View style={[styles.footerLine, { opacity: fadeAnim }]} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  glow: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: -1,
  },
  footerLine: {
    position: 'absolute',
    bottom: 50,
    width: 60,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  }
});

export default SplashScreen;