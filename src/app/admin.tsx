import { router } from 'expo-router';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

export default function AdminRoute() {
  return <AdminDashboardScreen navigation={{ canGoBack: () => router.canGoBack(), goBack: () => router.back(), navigate: (route: string) => router.replace(route === 'LoginModal' ? '/login' : '/(app)') }} />;
}
