import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/auth/auth-store';

export default function AuthLayout() {
  const status = useAuthStore((state) => state.status);
  if (status === 'authenticated') {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }} />;
}
