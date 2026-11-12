import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { GoogleSignInButton } from '../components/ui';
import { AuthBrandHeader } from '../components/ui/AuthBrandHeader';
import { ColorTheme, spacing, borderRadius } from '../theme';

interface LoginModalProps {
  navigation: any;
  route?: any;
}

export default function LoginModal({ navigation, route }: LoginModalProps) {
  const { login, sendPhoneCode, verifyPhoneCode } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneMode, setPhoneMode] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnToProfile = route?.params?.returnTo === 'Profile';

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleClose = () => {
    if (returnToProfile) {
      navigation.navigate('MainTabs', { screen: 'Home' });
      return;
    }
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Home' });
    }
  };

  const handleAuthSuccess = () => {
    if (returnToProfile && navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    handleClose();
  };

  useEffect(() => {
    if (Platform.OS !== 'android' || !returnToProfile) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('MainTabs', { screen: 'Home' });
      return true;
    });
    return () => subscription.remove();
  }, [navigation, returnToProfile]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      handleAuthSuccess();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    const digits = phone.replace(/\D/g, '');
    const normalizedPhone = phone.startsWith('+') ? `+${digits}` : `+977${digits.replace(/^0/, '')}`;
    if (digits.length < 10) {
      setError('Enter a valid phone number, for example +977 98XXXXXXXX.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await sendPhoneCode(normalizedPhone);
      setPhoneCodeSent(true);
    } catch (err: any) {
      setError(err?.message || 'Could not send a verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (code.trim().length < 4) {
      setError('Enter the verification code sent to your phone.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await verifyPhoneCode(code);
      handleAuthSuccess();
    } catch (err: any) {
      setError(err?.message || 'Phone verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AuthBrandHeader onClose={handleClose} message={t.common.tagline} />
        <View style={styles.panel}>
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>{t.auth.loginEyebrow}</Text>
            <Text style={styles.title}>{t.auth.loginTitle}</Text>
            <Text style={styles.subtitle}>{t.auth.loginHeroSubtitle}</Text>
          </View>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form Inputs */}
        <View style={styles.form}>
          <Text style={styles.label}>{t.auth.email}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.auth.emailPlaceholder}
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>{t.auth.password}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                setError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              accessibilityRole="button"
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>{t.profile.signIn}</Text>
            )}
          </TouchableOpacity>

          {/* Social Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t.auth.continueWith}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign In with Google */}
          <GoogleSignInButton
            onSuccess={handleAuthSuccess}
            onError={(msg) => setError(msg)}
          />
          {!phoneMode ? (
            <TouchableOpacity onPress={() => { setPhoneMode(true); setError(null); }}>
              <Text style={[styles.footerLink, { textAlign: 'center', marginTop: 18 }]}>Continue with phone</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.dividerText, { fontSize: 12, lineHeight: 18, letterSpacing: 0, marginBottom: 12 }]}>
                Firebase will process your phone number to verify your sign-in and help prevent abuse.
              </Text>
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                placeholder="+977 98XXXXXXXX"
                placeholderTextColor="#64748b"
                value={phone}
                onChangeText={(value) => { setPhone(value); setError(null); }}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              {phoneCodeSent && <>
                <Text style={styles.label}>Verification code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter SMS code"
                  placeholderTextColor="#64748b"
                  value={code}
                  onChangeText={(value) => { setCode(value); setError(null); }}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                />
              </>}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={phoneCodeSent ? handleVerifyPhoneCode : handleSendPhoneCode}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.submitBtnText}>{phoneCodeSent ? 'Verify and continue' : 'Send verification code'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setPhoneMode(false); setPhoneCodeSent(false); setError(null); }}>
                <Text style={[styles.footerLink, { textAlign: 'center', marginTop: 16 }]}>Use email instead</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Switch to Register */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t.auth.newToBrand}</Text>
          <TouchableOpacity onPress={() => navigation.replace('RegisterModal', returnToProfile ? { returnTo: 'Profile' } : undefined)}>
            <Text style={styles.footerLink}> {t.auth.createAccountLink}</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, paddingBottom: 24 },
    panel: { width: '100%', maxWidth: 540, alignSelf: 'center', marginTop: -22, paddingHorizontal: spacing.xl, paddingTop: 28, paddingBottom: 34, backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
    intro: { marginBottom: 22 },
    eyebrow: { color: '#7C3AED', fontSize: 11, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 },
    title: { fontFamily: 'serif', fontSize: 29, lineHeight: 35, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 14, lineHeight: 21, color: colors.textMuted, marginTop: 8 },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.errorMuted,
      borderWidth: 1,
      borderColor: colors.error,
      padding: 12,
      borderRadius: borderRadius.md,
      marginBottom: 16,
      gap: 8,
    },
    errorText: { color: colors.error, fontSize: 13, flex: 1 },
    form: { marginTop: 0 },
    label: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.25, marginBottom: 7 },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 13,
      paddingHorizontal: 15,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.surfaceBorderLight,
      marginBottom: 17,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.surfaceBorderLight,
      marginBottom: 17,
      paddingRight: 12,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 15,
    },
    eyeBtn: {
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitBtn: {
      backgroundColor: '#5B21B6',
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#F5B942',
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.25 },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },
    footerText: { color: colors.textMuted, fontSize: 14 },
    footerLink: { color: colors.purpleText, fontSize: 14, fontWeight: '700' },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 17,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.surfaceBorder,
    },
    dividerText: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 1,
    },
  });
