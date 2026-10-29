
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="auth/login"
        options={{ title: 'Entrar' }}
      />

      <Stack.Screen
        name="auth/register"
        options={{ title: 'Criar conta' }}
      />

      <Stack.Screen
        name="stores/index"
        options={{ title: 'Minhas lojas' }}
      />
    </Stack>
  );
}

