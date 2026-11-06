import { router } from 'expo-router';
import LoginModal from '../screens/LoginModal';

export default function LoginRoute() {
  return <LoginModal navigation={{ canGoBack: () => router.canGoBack(), goBack: () => router.back(), navigate: () => router.replace('/'), replace: (route: string) => router.replace(route === 'RegisterModal' ? '/register' : '/') }} />;
}
