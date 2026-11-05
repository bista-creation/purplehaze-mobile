import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from '../stores/theme-store';

export default function IndexRoute() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const { colors } = useTheme();
  if (isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.purple} /></View>;
  return <Redirect href="/(app)" />;
}
