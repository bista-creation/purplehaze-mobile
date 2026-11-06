import { useEffect, useRef } from 'react';
import { Platform, StatusBar as NativeStatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { MayaFloatingWidget } from '../components/MayaFloatingWidget';
import { pushNotifications } from '../services/push-notifications';
import { useAuthStore } from '../stores/auth-store';
import { useFavoritesStore } from '../stores/favorites-store';
import { useLanguageStore } from '../i18n';
import { useTheme, useThemeStore } from '../stores/theme-store';

function AppRouter() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const canAccessAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? NativeStatusBar.currentHeight || 0 : 0);
  const bottomPadding = Math.max(insets.bottom, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(app)" />
        <Stack.Protected guard={!isLoading && !isAuthenticated}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
        <Stack.Protected guard={!isLoading && isAuthenticated && canAccessAdmin}>
          <Stack.Screen name="admin" />
        </Stack.Protected>
        <Stack.Screen name="index" />
      </Stack>
      {isAuthenticated ? <MayaFloatingWidget /> : null}
    </View>
  );
}

export default function RootLayout() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const systemColorScheme = useColorScheme();
  const themeInitializationStarted = useRef(false);

  useEffect(() => {
    useLanguageStore.getState().initLanguage();
    useFavoritesStore.getState().initFavorites();
    void Font.loadAsync({ 'DancingScript-Bold': require('../../assets/fonts/DancingScript-Bold.ttf') });
    void checkAuth();
    void pushNotifications.registerForPushNotifications().catch(() => {});
    const notificationSubscription = pushNotifications.addNotificationResponseListener((data) => {
      if (data?.orderId) console.log('[Notification Tap] Target order:', data.orderId);
    });
    return () => notificationSubscription();
  }, [checkAuth]);

  useEffect(() => {
    const themeStore = useThemeStore.getState();
    if (!themeInitializationStarted.current) {
      themeInitializationStarted.current = true;
      void themeStore.initTheme(systemColorScheme);
    } else {
      themeStore.setSystemScheme(systemColorScheme);
    }
  }, [systemColorScheme]);

  return <SafeAreaProvider><AppRouter /></SafeAreaProvider>;
}

const styles = StyleSheet.create({ container: { flex: 1 } });
