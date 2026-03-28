import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated 
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Eye, EyeOff } from 'lucide-react-native';

const PasswordInput = ({ placeholder, value, onChangeText }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleVisibility = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setIsPasswordVisible(!isPasswordVisible);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.passwordContainer}>
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
          {isPasswordVisible ? (
            <EyeOff size={22} color={COLORS.primary} />
          ) : (
            <Eye size={22} color={COLORS.primary} />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNextStep = () => {
    if (signupStep === 1) {
      if (!username || !phone) return Alert.alert("Error", "Please enter all details");
      setSignupStep(2);
    } else if (signupStep === 2) {
      if (otp.length < 4) return Alert.alert("Error", "Enter valid OTP");
      setSignupStep(3);
    } else {
      if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match");
      navigation.navigate('Quality');
    }
  };

  const handleLogin = () => {
    if (!username || !password) {
        return Alert.alert("Error", "All fields are required");
    }
    navigation.navigate('Quality');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Join the Elite'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Sign in to continue your journey.' : `Step ${signupStep} of 3`}
            </Text>
          </View>

          <View style={styles.form}>
            {isLogin ? (
              <>
                <TextInput 
                  placeholder="Username" 
                  placeholderTextColor={COLORS.textSecondary}
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                />
                <PasswordInput 
                  placeholder="Password" 
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
                  <Text style={styles.buttonText}>SIGN IN</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {signupStep === 1 && (
                  <>
                    <TextInput 
                      placeholder="Username" 
                      placeholderTextColor={COLORS.textSecondary}
                      style={styles.input} 
                      value={username}
                      onChangeText={setUsername}
                    />
                    <TextInput 
                      placeholder="Phone Number (WhatsApp)" 
                      placeholderTextColor={COLORS.textSecondary}
                      keyboardType="phone-pad"
                      style={styles.input} 
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </>
                )}

                {signupStep === 2 && (
                  <TextInput 
                    placeholder="Enter 4-Digit OTP" 
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={[styles.input, styles.otpInput]} 
                    value={otp}
                    onChangeText={setOtp}
                  />
                )}

                {signupStep === 3 && (
                  <>
                    <PasswordInput 
                      placeholder="New Password" 
                      value={password}
                      onChangeText={setPassword}
                    />
                    <PasswordInput 
                      placeholder="Confirm Password" 
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </>
                )}

                <TouchableOpacity style={styles.mainButton} onPress={handleNextStep}>
                  <Text style={styles.buttonText}>
                    {signupStep === 3 ? 'FINISH' : 'CONTINUE'}
                  </Text>
                </TouchableOpacity>

                {signupStep > 1 && (
                   <TouchableOpacity onPress={() => setSignupStep(signupStep - 1)} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                   </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity 
              onPress={() => {
                setIsLogin(!isLogin);
                setSignupStep(1);
              }}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Text style={{ color: COLORS.primary }}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 30 },
  header: { marginTop: 80, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 10, letterSpacing: 0.5 },
  form: { width: '100%' },
  input: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 12,
    color: COLORS.textPrimary,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    paddingRight: 15,
  },
  flexInput: {
    flex: 1,
    padding: 18,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  eyeButton: {
    padding: 5,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
  },
  mainButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 8,
  },
  buttonText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 16, letterSpacing: 2 },
  backButton: { marginTop: 15 },
  backButtonText: { color: COLORS.textSecondary, textAlign: 'center' },
  switchButton: { marginTop: 25, marginBottom: 40, alignItems: 'center' },
  switchText: { color: COLORS.textSecondary, fontSize: 14 }
});

export default AuthScreen;