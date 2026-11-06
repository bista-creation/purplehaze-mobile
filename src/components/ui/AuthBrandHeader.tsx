import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../stores/theme-store';

type AuthBrandHeaderProps = {
  onClose: () => void;
  message: string;
};

export function AuthBrandHeader({ onClose, message }: AuthBrandHeaderProps) {
  const { isDark, colors, toggleTheme } = useTheme();

  return (
    <ImageBackground
      source={require('../../../assets/venues/purplehaze-longshot.jpg')}
      style={styles.hero}
      imageStyle={styles.heroImage}
      resizeMode="cover"
      accessibilityLabel="Purple Haze garden illuminated at night"
    >
      <View pointerEvents="none" style={styles.scrim} />
      <TouchableOpacity
        style={[styles.themeButton, { borderColor: 'rgba(245,185,66,0.5)' }]}
        onPress={() => { void toggleTheme(); }}
        accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        accessibilityHint="Changes the app appearance"
        accessibilityRole="button"
      >
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={17} color={colors.gold} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel="Close"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={21} color="#F7F2FF" />
      </TouchableOpacity>
      <View style={styles.brandLockup}>
        <View style={styles.logoFrame}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Purple Haze official logo"
          />
        </View>
        <Text style={styles.brandName}>Purple Haze</Text>
        <Text style={styles.brandSubtitle}>RESTRO &amp; GARDEN</Text>
        <View style={styles.rule} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 270,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#130B1D',
    overflow: 'hidden',
  },
  heroImage: { opacity: 0.84 },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(19, 11, 29, 0.68)',
  },
  closeButton: {
    position: 'absolute',
    zIndex: 1,
    top: 14,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,185,66,0.5)',
  },
  themeButton: {
    position: 'absolute',
    zIndex: 1,
    top: 14,
    right: 66,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
  },
  brandLockup: { alignItems: 'center', paddingTop: 10 },
  logoFrame: {
    width: 78,
    height: 78,
    borderRadius: 39,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F5B942',
    backgroundColor: '#FFF9EA',
    marginBottom: 8,
  },
  logo: { width: '100%', height: '100%' },
  brandName: {
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    color: '#F5B942',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginTop: 1,
  },
  rule: { width: 38, height: 1, backgroundColor: '#F5B942', marginTop: 11, marginBottom: 8 },
  message: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    letterSpacing: 0.35,
    textAlign: 'center',
  },
});
