import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../stores/theme-store';
import { MayaAssistantEmbed } from '../components/MayaAssistantEmbed';

export default function MayaModal({ navigation }: any) {
  const { colors, mode } = useTheme();

  const handleClose = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Home' });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: mode === 'dark' ? '#1E132C' : colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.gold + '22' }]}>
            <Ionicons name="sparkles" size={18} color={colors.gold || '#D4AF37'} />
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Maya AI</Text>
              <View style={[styles.aiBadge, { backgroundColor: colors.gold + '25' }]}>
                <Text style={[styles.aiBadgeText, { color: colors.gold || '#D4AF37' }]}>
                  Live Assistant
                </Text>
              </View>
            </View>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Purple Haze Restro &amp; Garden
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.surface }]}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          aria-label="Close Maya Assistant"
        >
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Embedded Assistant */}
      <View style={styles.embedContainer}>
        <MayaAssistantEmbed onClose={handleClose} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  aiBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  embedContainer: {
    flex: 1,
    overflow: 'hidden',
  },
});
