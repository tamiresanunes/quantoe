import { Stack } from 'expo-router';

import { AuthProvider, useAuth } from '@/features/auth/auth-context';

function AppStack() {
  const { user } = useAuth();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!user} redirectTo="/stores">
        <Stack.Screen name="auth/login" options={{ title: 'Entrar' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Criar conta' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!user} redirectTo="/auth/login">
        <Stack.Screen name="stores/index" options={{ title: 'Minhas lojas' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppStack />
    </AuthProvider>
  );
}
