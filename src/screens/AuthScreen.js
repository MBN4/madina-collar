import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, StatusBar
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 0, friction: 8, useNativeDriver: true })
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
            <Animated.View style={[styles.header, { opacity: entranceAnim, transform: [{ translateY: formAnim }] }]}>
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
                  <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
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
                  <TouchableOpacity style={[styles.mainButton, (signupStep === 2 && timer === 0) && { opacity: 0.5 }]} onPress={handleSignupFlow} disabled={signupStep === 2 && timer === 0}>
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
  content: { flex: 1, paddingHorizontal: 30 },
  header: { marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8, letterSpacing: 0.5 },
  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  inputIcon: { marginRight: 10 },
  passwordContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  flexInput: { flex: 1, paddingVertical: 18, color: COLORS.textPrimary, fontSize: 16, fontWeight: '500' },
  input: { 
    backgroundColor: '#FFFFFF', 
    padding: 18, 
    borderRadius: 16, 
    color: COLORS.textPrimary, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  eyeButton: { padding: 5 },
  otpInput: { textAlign: 'center', fontSize: 32, letterSpacing: 15, color: COLORS.primary, fontWeight: '900' },
  timerText: { color: COLORS.primary, textAlign: 'center', marginBottom: 15, fontSize: 14, fontWeight: '600' },
  mainButton: { 
    backgroundColor: COLORS.primary, 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 10, 
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  backButton: { marginTop: 15, padding: 10 },
  backButtonText: { color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  switchButton: { marginTop: 30, marginBottom: 40, alignItems: 'center' },
  switchText: { color: COLORS.textSecondary, fontSize: 15, letterSpacing: 0.5 }
});

export default AuthScreen;