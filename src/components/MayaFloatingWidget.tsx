import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMayaStore } from '../stores/maya-store';
import { useThemeStore } from '../stores/theme-store';
import { useCartStore } from '../stores/cart-store';
import { MayaAssistantEmbed } from './MayaAssistantEmbed';

export const MayaFloatingWidget: React.FC = () => {
  const isOpen = useMayaStore((s) => s.isOpen);
  const closeMaya = useMayaStore((s) => s.closeMaya);
  const openMaya = useMayaStore((s) => s.openMaya);
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const cartItemCount = useCartStore((s) => s.getItemCount());

  const launcherBottom = cartItemCount > 0 ? 140 : 84;

  if (!isOpen) {
    return (
      <TouchableOpacity
        style={[
          styles.floatingLauncher,
          {
            bottom: launcherBottom,
            backgroundColor: mode === 'dark' ? colors.purpleDark : colors.purple,
            borderColor: colors.gold,
            shadowColor: colors.purple,
          },
          Platform.OS === 'web' && ({
            position: 'fixed',
            bottom: launcherBottom + 3,
            right: 16,
            zIndex: 40,
          } as any),
        ]}
        onPress={openMaya}
        activeOpacity={0.85}
        aria-label="Open Maya AI Assistant"
      >
        <Text style={styles.launcherIcon}>✨</Text>
        <View style={styles.onlineDot} />
      </TouchableOpacity>
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
          zIndex: 40,
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
            backgroundColor: mode === 'dark' ? '#1F132B' : '#FFFFFF',
            borderColor: colors.gold,
          },
        ]}
      >
        {/* Top Mini Header with Close Button */}
        <View
          style={[
            styles.headerBar,
            {
              borderBottomColor: colors.surfaceBorder,
              backgroundColor: mode === 'dark' ? '#281A36' : '#FAF7F2',
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerSparkle}>✨</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Maya AI Assistant</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                backgroundColor: colors.surfaceElevated,
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
              },
            ]}
            onPress={closeMaya}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            aria-label="Close Maya Assistant"
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

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
    bottom: 84,
    right: 16,
    zIndex: 40,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
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
    zIndex: 40,
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSparkle: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  embedWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
});
