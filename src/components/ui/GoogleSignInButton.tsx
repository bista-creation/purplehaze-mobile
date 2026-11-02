import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth-store';
import { promptGoogleSignIn } from '../../services/google-auth';
import { colors, borderRadius, spacing } from '../../theme';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (errMessage: string) => void;
  style?: any;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  style,
}) => {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuthStore();

  const handlePress = async () => {
    setLoading(true);
    try {
      const res = await promptGoogleSignIn();
      if (!res?.idToken) {
        // User cancelled the browser prompt or dismissed
        setLoading(false);
        return;
      }

      await loginWithGoogle(res.idToken);
      if (onSuccess) onSuccess();
    } catch (e: any) {
      console.warn('[GoogleSignIn] Error:', e);
      const msg = e?.message || 'Google sign-in could not be completed.';
      if (onError) {
        onError(msg);
      } else {
        Alert.alert('Google Sign-In', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <View style={styles.contentRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
          </View>
          <Text style={styles.buttonText}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
});
