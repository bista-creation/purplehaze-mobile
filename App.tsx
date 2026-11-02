import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/auth-store';
import { useLanguageStore } from './src/i18n';
import { useFavoritesStore } from './src/stores/favorites-store';
import { pushNotifications } from './src/services/push-notifications';

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // 0. Initialize language and favorites from secure storage
    useLanguageStore.getState().initLanguage();
    useFavoritesStore.getState().initFavorites();

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
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
