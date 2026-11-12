import React, { useEffect } from 'react';
import { View, Platform, StatusBar as RNStatusBar, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/auth-store';
import { useLanguageStore } from './src/i18n';
import { useFavoritesStore } from './src/stores/favorites-store';
import { useThemeStore, useTheme } from './src/stores/theme-store';
import { pushNotifications } from './src/services/push-notifications';
import * as Font from 'expo-font';

function MainAppContent() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Protect top content from mobile network/wifi status bar + 5px margin
  const topPadding =
    Math.max(
      insets.top,
      Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0
    ) + 5;

  // Protect bottom navigation & buttons from device home bar/navigation + 3px margin
  const bottomPadding = Math.max(insets.bottom, 0) + 3;

  return (
    <View
      style={[
        styles.rootContainer,
        {
          backgroundColor: colors.surface,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <RootNavigator />
    </View>
  );
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const { mode } = useTheme();

  useEffect(() => {
    // 0. Initialize theme, language and favorites from secure storage
    useThemeStore.getState().initTheme();
    useLanguageStore.getState().initLanguage();
    useFavoritesStore.getState().initFavorites();

    // 0.1 Load Dancing Script brand font
    Font.loadAsync({
      'DancingScript-Bold': require('./assets/fonts/DancingScript-Bold.ttf'),
    }).catch((e) => console.warn('[App] Font load warning:', e));

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontId = 'dancing-script-google-font';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=swap';
        document.head.appendChild(link);
      }
    }

    // 1. Verify persisted tokens and load user profile
    checkAuth();

    // 2. Request push notification permissions and register token with backend
    pushNotifications.registerForPushNotifications().catch(() => {});

    // 3. Listen for push notification clicks
    const unsubscribeNotifications = pushNotifications.addNotificationResponseListener((data) => {
      if (data?.orderId) {
        // Deep navigation is handled automatically or by deep link prefix
        console.log('[Notification Tap] Target order:', data.orderId);
      }
    });

    return () => {
      unsubscribeNotifications();
    };
  }, [checkAuth]);

  return (
    <SafeAreaProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <MainAppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
});
