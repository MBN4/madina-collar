import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Lock, Phone, User } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert, Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform, ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { COLORS } from '../theme/colors';
import api from '../utils/api';

const PasswordInput = ({ placeholder, value, onChangeText }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleVisibility = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setIsPasswordVisible(!isPasswordVisible);
      Animated.timing(fadeAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={styles.passwordContainer}>
      <Lock size={20} color={COLORS.primary} style={styles.inputIcon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#999"
        secureTextEntry={!isPasswordVisible}
        style={styles.flexInput}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity onPress={toggleVisibility} style={styles.eyeButton}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim }] }}>
          {isPasswordVisible ? <EyeOff size={22} color={COLORS.primary} /> : <Eye size={22} color={COLORS.primary} />}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MarqueeRow = ({ logos, duration = 25000, reverse = false, yOffset = 0 }) => {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const totalWidth = logos.length * 150;
    const animateScroll = () => {
      scrollAnim.setValue(reverse ? -totalWidth : 0);
      Animated.timing(scrollAnim, {
        toValue: reverse ? 0 : -totalWidth,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => animateScroll());
    };

    const animateFloating = () => {
      Animated.sequence([
        Animated.timing(floatingAnim, { toValue: 10, duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatingAnim, { toValue: -10, duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]).start(() => animateFloating());
    };

    animateScroll();
    animateFloating();
  }, [logos]);

  return (
    <Animated.View style={[styles.marqueeRow, { transform: [{ translateX: scrollAnim }, { translateY: floatingAnim }] }]}>
      {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
        <View key={index} style={[styles.marqueeItem, { marginTop: (index % 2 === 0 ? 20 : -20) }]}>
          <View style={styles.logoPod}>
            <Image source={logo} style={styles.marqueeLogo} resizeMode="contain" />
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

const AuthScreen = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const entranceAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true })
    ]).start();
  }, [isLogin]);

  const handleSignupFlow = async () => {
    if (loading) return;
    if (!username || !phone || !password || !confirmPassword) return Alert.alert("Error", "Please enter all details");
    if (phone.length !== 11) return Alert.alert("Error", "Phone number must be exactly 11 digits");
    if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match");
    setLoading(true);
    try {
      await api.post('/auth/register', { username, phone, password });
      Alert.alert("Success", "Registration complete! Please Sign In.");
      setIsLogin(true);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert("Error", err.response?.data?.msg || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!phone || !password) return Alert.alert("Error", "All fields are required");
    if (phone.length !== 11) return Alert.alert("Error", "Phone number must be exactly 11 digits");
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { phone, password });
      await setAuth(res.data.user, res.data.token);
      // On success the navigator swaps to the app stack and this screen unmounts,
      // so there's no need to reset loading here.
    } catch (err) {
      Alert.alert("Error", err.response?.data?.msg || "Invalid Credentials");
      setLoading(false);
    }
  };

  const MARQUEE_LOGOS = [
    require('../../assets/images/anarkali.jpg'),
    require('../../assets/images/angle.jpg'),
    require('../../assets/images/madina-collar.jpg'),
    require('../../assets/images/new-madina-collar.png'),
    require('../../assets/images/pak.jpg'),
  ];

  return (
    <LinearGradient colors={COLORS.yellowGradient} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background Diagonal Marquees — purely decorative.
          pointerEvents="none" lets all taps fall through to the form; without it
          the high-elevation logo pods (Android stacks by elevation) sit above the
          Sign In button / eye toggle and swallow their touches. Mirrors the web
          app's `.marqueeBackground { pointer-events: none }`. */}
      <View style={styles.marqueeBackground} pointerEvents="none">
        <View style={[styles.diagonalMarquee, styles.bottomLeftMarquee]}>
          <MarqueeRow logos={MARQUEE_LOGOS} duration={35000} />
        </View>
        <View style={[styles.diagonalMarquee, styles.bottomRightMarquee]}>
          <MarqueeRow logos={MARQUEE_LOGOS} duration={45000} reverse />
        </View>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <Animated.View style={[styles.header, { opacity: entranceAnim, transform: [{ translateY: formAnim }, { scale: logoScale }] }]}>
              <View style={styles.logoContainer}>
                 <Image source={require('../../assets/images/madina-collar-round.png')} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.title}>{isLogin ? 'Authentic Choice' : 'Join the Elite'}</Text>
              <Text style={styles.subtitle}>{isLogin ? 'Sign in to continue your journey.' : 'Create your account to get started.'}</Text>
            </Animated.View>
            
            <Animated.View style={[styles.form, { opacity: entranceAnim, transform: [{ translateY: formAnim }] }]}>
              {isLogin ? (
                <>
                  <View style={styles.inputWrapper}>
                    <Phone size={20} color={COLORS.primary} style={styles.inputIcon} />
                    <TextInput 
                      placeholder="Phone Number" 
                      placeholderTextColor="#999" 
                      keyboardType="phone-pad" 
                      maxLength={11} 
                      style={styles.flexInput} 
                      value={phone} 
                      onChangeText={setPhone} 
                    />
                  </View>
                  <PasswordInput placeholder="Password" value={password} onChangeText={setPassword} />
                  <TouchableOpacity activeOpacity={0.8} style={[styles.mainButton, loading && styles.mainButtonDisabled]} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color={COLORS.textPrimary} />
                    ) : (
                      <Text style={styles.buttonText}>SIGN IN</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputWrapper}>
                    <User size={20} color={COLORS.primary} style={styles.inputIcon} />
                    <TextInput placeholder="Username" placeholderTextColor="#999" style={styles.flexInput} value={username} onChangeText={setUsername} />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Phone size={20} color={COLORS.primary} style={styles.inputIcon} />
                    <TextInput placeholder="Phone Number" placeholderTextColor="#999" keyboardType="phone-pad" maxLength={11} style={styles.flexInput} value={phone} onChangeText={setPhone} />
                  </View>
                  <PasswordInput placeholder="Password" value={password} onChangeText={setPassword} />
                  <PasswordInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} />
                  <TouchableOpacity activeOpacity={0.8} style={[styles.mainButton, loading && styles.mainButtonDisabled]} onPress={handleSignupFlow} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color={COLORS.textPrimary} />
                    ) : (
                      <Text style={styles.buttonText}>REGISTER</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={() => { setIsLogin(!isLogin); }} style={styles.switchButton}>
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text style={styles.switchHighlight}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://toptrendingms.com/')} style={styles.creditButton}>
                <Text style={styles.creditText}>
                  Designed & Developed by <Text style={styles.creditHighlight}>TOPTRENDING</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 35 },
  header: { marginBottom: 35, alignItems: 'center' },
  logoContainer: { marginBottom: 20, elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  logo: { width: 120, height: 120 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8, letterSpacing: 0.5, textAlign: 'center', opacity: 0.7 },
  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingHorizontal: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  inputIcon: { marginRight: 12 },
  passwordContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#EFEFEF', 
    paddingHorizontal: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  flexInput: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 20 : 16, color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  input: { 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 20, 
    color: COLORS.textPrimary, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#EFEFEF', 
    fontSize: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  eyeButton: { padding: 5 },
  otpInput: { textAlign: 'center', fontSize: 36, letterSpacing: 10, color: COLORS.textPrimary, fontWeight: '900' },
  timerText: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 15, fontSize: 14, fontWeight: '700' },
  mainButton: { 
    backgroundColor: COLORS.primary, 
    padding: 22, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginTop: 15, 
    elevation: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  mainButtonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 18, letterSpacing: 1.5 },
  backButton: { marginTop: 20, padding: 10 },
  backButtonText: { color: COLORS.textSecondary, textAlign: 'center', fontWeight: '700' },
  switchButton: { marginTop: 35, marginBottom: 12, alignItems: 'center' },
  switchText: { color: COLORS.textPrimary, fontSize: 15, letterSpacing: 0.5, fontWeight: '600' },
  switchHighlight: { color: COLORS.textSecondary, fontWeight: '900', textDecorationLine: 'underline' },
  creditButton: { marginBottom: 30, alignItems: 'center', paddingVertical: 6 },
  creditText: { color: COLORS.textPrimary, opacity: 0.5, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', textTransform: 'uppercase' },
  creditHighlight: { opacity: 1, fontWeight: '900', color: COLORS.textPrimary },
  
  // Marquee Styles
  marqueeBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  diagonalMarquee: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2.5,
    paddingVertical: 40,
    zIndex: 0,
  },
  bottomLeftMarquee: {
    bottom: 80,
    left: -SCREEN_WIDTH * 0.7,
    transform: [{ rotate: '-12deg' }],
  },
  bottomRightMarquee: {
    bottom: -60,
    right: -SCREEN_WIDTH * 0.7,
    transform: [{ rotate: '12deg' }],
  },
  marqueeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marqueeItem: {
    marginHorizontal: 25,
  },
  logoPod: {
    width: 90,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 45,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    // No Android elevation: this is a background decoration and elevation would
    // stack it above the form controls. iOS shadow props are harmless here.
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  marqueeLogo: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
});

export default AuthScreen;