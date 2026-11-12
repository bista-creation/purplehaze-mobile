import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { usePathname } from 'expo-router';
import { useMayaStore } from '../stores/maya-store';
import { useThemeStore } from '../stores/theme-store';
import { useCartStore } from '../stores/cart-store';
import { MayaAssistantEmbed } from './MayaAssistantEmbed';

export const MayaFloatingWidget: React.FC = () => {
  const pathname = usePathname();
  const isOpen = useMayaStore((s) => s.isOpen);
  const isModalOpen = useMayaStore((s) => s.isModalOpen);
  const closeMaya = useMayaStore((s) => s.closeMaya);
  const openMaya = useMayaStore((s) => s.openMaya);
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const cartItemCount = useCartStore((s) => s.getItemCount());

  // Check web location for direct /maya URL or admin routes
  const isWebExcludedRoute = Platform.OS === 'web' && typeof window !== 'undefined' && (
    window.location.pathname.toLowerCase().includes('admin') ||
    window.location.pathname.toLowerCase().includes('maya') ||
    window.location.hash.toLowerCase().includes('admin') ||
    window.location.hash.toLowerCase().includes('maya')
  );

  // When cart has items, floating cart bar is at bottom: 10 (top of cart at ~120px from root bottom).
  // Position Maya safely above the floating cart at bottom: 132 so they never overlap.
  // When cart is empty, Maya rests comfortably at bottom: 74 just above the navigation dock.
  const targetBottom = cartItemCount > 0 ? 132 : 74;
  const [bottomAnim] = useState(() => new Animated.Value(targetBottom));

  useEffect(() => {
    Animated.spring(bottomAnim, {
      toValue: targetBottom,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [targetBottom, bottomAnim]);

  // Never display Maya floating widget on Admin operations / dashboard screens,
  // or when the dedicated MayaModal screen is active, to prevent duplicate Maya windows.
  if (
    isModalOpen ||
    isWebExcludedRoute ||
    pathname?.toLowerCase().includes('admin') ||
    pathname?.toLowerCase().includes('maya')
  ) {
    return null;
  }

  if (!isOpen) {
    return (
      <Animated.View
        style={[
          styles.floatingLauncher,
          {
            bottom: bottomAnim,
            backgroundColor: mode === 'dark' ? colors.purpleDark : colors.purple,
            borderColor: colors.gold,
            shadowColor: colors.purple,
          },
          Platform.OS === 'web' && ({
            position: 'fixed',
            right: 16,
            zIndex: 40,
          } as any),
        ]}
      >
        <TouchableOpacity
          style={styles.launcherTouchable}
          onPress={openMaya}
          activeOpacity={0.85}
          aria-label="Open Maya AI Assistant"
        >
          <Text style={styles.launcherIcon}>✨</Text>
          <View style={styles.onlineDot} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // When Open
  return (
    <View
      style={[
        styles.widgetContainer,
        Platform.OS === 'web' && ({
          position: 'fixed',
          bottom: 23,
          right: 20,
          zIndex: 150,
          width: 380,
          height: 600,
          maxWidth: 'calc(100vw - 30px)',
          maxHeight: 'calc(100vh - 40px)',
        } as any),
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: mode === 'dark' ? '#130B1D' : '#FAF8FF',
            borderColor: colors.gold,
          },
        ]}
      >
        {/* Embedded Assistant */}
        <View style={[styles.embedWrapper, { backgroundColor: mode === 'dark' ? '#130B1D' : '#FAF8FF' }]}>
          <MayaAssistantEmbed onClose={closeMaya} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingLauncher: {
    position: 'absolute',
    right: 16,
    zIndex: 40,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  launcherTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  launcherIcon: {
    fontSize: 20,
    textAlign: 'center',
  },
  onlineDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  widgetContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 150,
    width: 380,
    height: 600,
    maxWidth: '92%',
    maxHeight: '85%',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  embedWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
});
