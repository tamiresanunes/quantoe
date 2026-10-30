import { router } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';

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
    <View style={styles.container}>
      <Text style={styles.title}>QuantoÉ</Text>
      <Text>
        Entrada simulada. Use ana@example.com ou bruna@example.com e qualquer
        senha não vazia.
      </Text>
      <TextInput
        accessibilityLabel="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="E-mail"
        style={styles.input}
        value={email}
      />
      <TextInput
        accessibilityLabel="Senha"
        onChangeText={setPassword}
        placeholder="Senha"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        disabled={loading}
        onPress={handleSignIn}
        title={loading ? 'Entrando...' : 'Entrar'}
      />
      <Button
        onPress={() => router.push('/auth/register')}
        title="Criar conta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 8, padding: 12 },
  error: { color: '#B00020' },
});
