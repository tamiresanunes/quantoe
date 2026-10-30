import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { useAuth } from '@/features/auth/auth-context';
import { colors } from '@/theme/colors';
import { globalStyles } from '@/theme/styles';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('ana@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      router.replace('/stores');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível entrar.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[globalStyles.screen, styles.container]}>
      <Text style={[globalStyles.title, styles.title]}>QuantoÉ</Text>
      <Text style={globalStyles.body}>
        Entrada simulada. Use ana@example.com ou bruna@example.com e qualquer
        senha não vazia.
      </Text>
      <TextInput
        accessibilityLabel="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="E-mail"
        placeholderTextColor={colors.text.auxiliary}
        selectionColor={colors.brand.terracotta}
        style={globalStyles.input}
        value={email}
      />
      <TextInput
        accessibilityLabel="Senha"
        onChangeText={setPassword}
        placeholder="Senha"
        placeholderTextColor={colors.text.auxiliary}
        secureTextEntry
        selectionColor={colors.brand.terracotta}
        style={globalStyles.input}
        value={password}
      />
      {error ? <Text style={globalStyles.error}>{error}</Text> : null}
      <AppButton
        disabled={loading}
        onPress={handleSignIn}
        title={loading ? 'Entrando...' : 'Entrar'}
      />
      <AppButton
        onPress={() => router.push('/auth/register')}
        title="Criar conta"
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  title: { fontSize: 32, textAlign: 'center' },
});
