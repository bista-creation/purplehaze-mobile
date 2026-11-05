import { router } from 'expo-router';
import RegisterModal from '../screens/RegisterModal';

export default function RegisterRoute() {
  return <RegisterModal navigation={{ canGoBack: router.canGoBack, goBack: router.back, navigate: () => router.replace('/'), replace: (route: string) => router.replace(route === 'LoginModal' ? '/login' : '/') }} />;
}
