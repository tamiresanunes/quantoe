import { Stack } from 'expo-router';

import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { colors } from '@/theme/colors';

function AppStack() {
  const { user } = useAuth();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background.primary },
        headerStyle: { backgroundColor: colors.background.primary },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { color: colors.text.primary },
      }}
    >
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
