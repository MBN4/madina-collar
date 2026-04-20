import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, StatusBar, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { Eye, EyeOff, Lock, Phone, User } from 'lucide-react-native';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
        placeholderTextColor={COLORS.textSecondary}
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

const AuthScreen = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const entranceAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true })
    ]).start();
  }, [isLogin, signupStep]);

  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const handleSignupFlow = async () => {
    try {
      if (signupStep === 1) {
        if (!username || !phone) return Alert.alert("Error", "Please enter all details");
        if (phone.length !== 11) return Alert.alert("Error", "Phone number must be exactly 11 digits");
        await api.post('/auth/register/step1', { username, phone });
        setSignupStep(2);
        setTimer(60);
        setIsTimerActive(true);
      } 
      else if (signupStep === 2) {
        if (otp.length < 4) return Alert.alert("Error", "Enter valid OTP");
        await api.post('/auth/register/step2', { phone, otp });
        setSignupStep(3);
        setIsTimerActive(false);
      } 
      else {
        if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match");
        await api.post('/auth/register/step3', { username, phone, password });
        Alert.alert("Success", "Registration complete! Please Sign In.");
        setIsLogin(true);
        setSignupStep(1);
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.msg || "Something went wrong");
    }
  };

  const handleLogin = async () => {
    if (!phone || !password) return Alert.alert("Error", "All fields are required");
    if (phone.length !== 11) return Alert.alert("Error", "Phone number must be exactly 11 digits");
    try {
      const res = await api.post('/auth/login', { phone, password });
      await setAuth(res.data.user, res.data.token);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.msg || "Invalid Credentials");
    }
  };

  return (
    <LinearGradient colors={COLORS.yellowGradient} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <Animated.View style={[styles.header, { opacity: entranceAnim, transform: [{ translateY: formAnim }, { scale: logoScale }] }]}>
              <View style={styles.logoContainer}>
                 <Image source={require('../../assets/images/madina-collar-round.png')} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Join the Elite'}</Text>
              <Text style={styles.subtitle}>{isLogin ? 'Sign in to continue your journey.' : `Step ${signupStep} of 3`}</Text>
            </Animated.View>
            
            <Animated.View style={[styles.form, { opacity: entranceAnim, transform: [{ translateY: formAnim }] }]}>
              {isLogin ? (
                <>
                  <View style={styles.inputWrapper}>
                    <Phone size={20} color={COLORS.primary} style={styles.inputIcon} />
                    <TextInput 
                      placeholder="Phone Number" 
                      placeholderTextColor={COLORS.textSecondary} 
                      keyboardType="phone-pad" 
                      maxLength={11} 
                      style={styles.flexInput} 
                      value={phone} 
                      onChangeText={setPhone} 
                    />
                  </View>
                  <PasswordInput placeholder="Password" value={password} onChangeText={setPassword} />
                  <TouchableOpacity activeOpacity={0.8} style={styles.mainButton} onPress={handleLogin}>
                    <Text style={styles.buttonText}>SIGN IN</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {signupStep === 1 && (
                    <>
                      <View style={styles.inputWrapper}>
                        <User size={20} color={COLORS.primary} style={styles.inputIcon} />
                        <TextInput placeholder="Username" placeholderTextColor={COLORS.textSecondary} style={styles.flexInput} value={username} onChangeText={setUsername} />
                      </View>
                      <View style={styles.inputWrapper}>
                        <Phone size={20} color={COLORS.primary} style={styles.inputIcon} />
                        <TextInput placeholder="Phone Number" placeholderTextColor={COLORS.textSecondary} keyboardType="phone-pad" maxLength={11} style={styles.flexInput} value={phone} onChangeText={setPhone} />
                      </View>
                    </>
                  )}
                  {signupStep === 2 && (
                    <View>
                      <TextInput placeholder="0000" placeholderTextColor={COLORS.textSecondary} keyboardType="number-pad" maxLength={4} style={[styles.input, styles.otpInput]} value={otp} onChangeText={setOtp} />
                      <Text style={styles.timerText}>{timer > 0 ? `Resend OTP in ${timer}s` : "OTP Expired. Please go back."}</Text>
                    </View>
                  )}
                  {signupStep === 3 && (
                    <>
                      <PasswordInput placeholder="New Password" value={password} onChangeText={setPassword} />
                      <PasswordInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} />
                    </>
                  )}
                  <TouchableOpacity activeOpacity={0.8} style={[styles.mainButton, (signupStep === 2 && timer === 0) && { opacity: 0.5 }]} onPress={handleSignupFlow} disabled={signupStep === 2 && timer === 0}>
                    <Text style={styles.buttonText}>{signupStep === 3 ? 'FINISH' : 'CONTINUE'}</Text>
                  </TouchableOpacity>
                  {signupStep > 1 && (
                     <TouchableOpacity onPress={() => setSignupStep(signupStep - 1)} style={styles.backButton}><Text style={styles.backButtonText}>Go Back</Text></TouchableOpacity>
                  )}
                </>
              )}
              <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setSignupStep(1); }} style={styles.switchButton}>
                <Text style={styles.switchText}>{isLogin ? "Don't have an account? " : "Already have an account? "}<Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>{isLogin ? 'Sign Up' : 'Sign In'}</Text></Text>
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
  otpInput: { textAlign: 'center', fontSize: 36, letterSpacing: 10, color: COLORS.primary, fontWeight: '900' },
  timerText: { color: COLORS.primary, textAlign: 'center', marginBottom: 15, fontSize: 14, fontWeight: '700' },
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
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1.5 },
  backButton: { marginTop: 20, padding: 10 },
  backButtonText: { color: COLORS.textSecondary, textAlign: 'center', fontWeight: '700' },
  switchButton: { marginTop: 35, marginBottom: 40, alignItems: 'center' },
  switchText: { color: COLORS.textSecondary, fontSize: 15, letterSpacing: 0.5 }
});

export default AuthScreen;