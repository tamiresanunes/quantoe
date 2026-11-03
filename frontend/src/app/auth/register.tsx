import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import { useAuth } from '@/features/auth/auth-context';
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
      router.replace({ pathname: '/stores', params: { registered: '1' } });
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
    <ScrollView
      contentContainerStyle={[globalStyles.screenContent, styles.container]}
      style={globalStyles.screen}
    >
      <Text style={[globalStyles.title, styles.title]}>Criar conta</Text>
      <AppTextField
        label="Nome"
        onChangeText={setName}
        placeholder="Nome"
        value={name}
      />
      <AppTextField
        label="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="E-mail"
        value={email}
      />
      <AppTextField
        label="Senha"
        onChangeText={setPassword}
        placeholder="Senha"
        secureTextEntry
        value={password}
      />
      {error ? (
        <AppFeedback
          variant="error"
          title="Não foi possível criar a conta"
          message={error}
          onDismiss={() => setError('')}
        />
      ) : null}
      <AppButton
        loading={loading}
        onPress={handleSignUp}
        title="Criar conta"
      />
      <AppButton
        onPress={() => router.replace('/auth/login')}
        title="Voltar para login"
        variant="secondary"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  title: { textAlign: 'center' },
});
