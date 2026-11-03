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
import { MayaAssistantEmbed } from './MayaAssistantEmbed';

export const MayaFloatingWidget: React.FC = () => {
  const isOpen = useMayaStore((s) => s.isOpen);
  const closeMaya = useMayaStore((s) => s.closeMaya);
  const openMaya = useMayaStore((s) => s.openMaya);
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);

  if (!isOpen) {
    return (
      <TouchableOpacity
        style={[
          styles.floatingLauncher,
          {
            backgroundColor: colors.primary,
            borderColor: colors.gold || '#D4AF37',
            shadowColor: '#5B21B6',
          },
        ]}
        onPress={openMaya}
        activeOpacity={0.85}
        aria-label="Open Maya AI Assistant"
      >
        <View style={styles.launcherContent}>
          <Text style={styles.launcherIcon}>✨</Text>
          <Text style={styles.launcherText}>Ask Maya</Text>
        </View>
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
          bottom: 20,
          right: 20,
          zIndex: 999999,
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
            backgroundColor: mode === 'dark' ? '#1E132C' : '#FFFFFF',
            borderColor: colors.gold || '#D4AF37',
          },
        ]}
      >
        {/* Top Mini Header with Close Button */}
        <View
          style={[
            styles.headerBar,
            {
              borderBottomColor: colors.border,
              backgroundColor: mode === 'dark' ? '#160c22' : '#F9F6F0',
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerSparkle}>✨</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Maya AI Assistant</Text>
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            onPress={closeMaya}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            aria-label="Close Maya Assistant"
          >
            <Ionicons name="close" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Embedded Assistant */}
        <View style={styles.embedWrapper}>
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
    zIndex: 999998,
    borderRadius: 28,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    cursor: 'pointer' as any,
  },
  launcherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  launcherIcon: {
    fontSize: 16,
  },
  launcherText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  onlineDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  widgetContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999999,
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
