import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { useAuth } from '@/features/auth/auth-context';
import { colors } from '@/theme/colors';
import { globalStyles } from '@/theme/styles';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    setError('');
    try {
      await signUp({ name, email, password });
      router.replace('/stores');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível criar a conta.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[globalStyles.screen, styles.container]}>
      <Text style={[globalStyles.title, styles.title]}>Criar conta</Text>
      <TextInput
        accessibilityLabel="Nome"
        onChangeText={setName}
        placeholder="Nome"
        placeholderTextColor={colors.text.auxiliary}
        selectionColor={colors.brand.terracotta}
        style={globalStyles.input}
        value={name}
      />
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
        onPress={handleSignUp}
        title={loading ? 'Criando...' : 'Criar conta'}
      />
      <AppButton
        onPress={() => router.replace('/auth/login')}
        title="Voltar para login"
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  title: { textAlign: 'center' },
});
