import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import { useAuth } from '@/features/auth/auth-context';
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';

const background = '#F9F2E9';
const terracotta = '#AE5A37';
const fieldBorder = '#E3D2C2';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
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
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={styles.logo} accessibilityLabel="Quanto É?">
              <Text style={styles.logoLetter}>Q</Text>
            </View>
            <Text style={styles.title}>Quanto É?</Text>
            <Text style={styles.subtitle}>
              Preço justo para cada peça com história.
            </Text>
          </View>

          <View style={styles.form}>
            <AppTextField
              label="E-mail"
              labelStyle={styles.fieldLabel}
              fieldStyle={styles.field}
              style={styles.fieldInput}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="tamires@brechoraiz.com"
              returnKeyType="next"
              value={email}
            />
            <AppTextField
              label="Senha"
              labelStyle={styles.fieldLabel}
              fieldStyle={styles.field}
              style={styles.fieldInput}
              autoComplete="current-password"
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!passwordVisible}
              value={password}
              rightAccessory={
                <Pressable
                  accessibilityLabel={
                    passwordVisible ? 'Ocultar senha' : 'Mostrar senha'
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: passwordVisible }}
                  hitSlop={8}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={styles.visibilityButton}
                >
                  <SymbolView
                    name={{
                      ios: passwordVisible ? 'eye.slash' : 'eye',
                      android: passwordVisible
                        ? 'visibility_off'
                        : 'visibility',
                      web: passwordVisible ? 'visibility_off' : 'visibility',
                    }}
                    size={20}
                    tintColor={colors.text.secondary}
                  />
                </Pressable>
              }
            />

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                Alert.alert(
                  'Recuperar senha',
                  'A recuperação de senha ainda não está disponível.',
                )
              }
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </Pressable>

            {error ? (
              <AppFeedback
                variant="error"
                title="Não foi possível entrar"
                message={error}
                onDismiss={() => setError('')}
              />
            ) : null}

            <AppButton
              loading={loading}
              onPress={handleSignIn}
              title="Entrar"
              style={styles.signInButton}
            />
            <AppButton
              onPress={() => router.push('/auth/register')}
              title="Criar conta"
              variant="secondary"
              style={styles.signUpButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: background },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 32,
  },
  brand: { alignItems: 'center' },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: terracotta,
    marginBottom: 10,
  },
  logoLetter: {
    fontFamily: fontFamilies.display,
    fontSize: 25,
    lineHeight: 32,
    color: '#FFFFFF',
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 30,
    lineHeight: 38,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    color: '#9E7667',
    textAlign: 'center',
    marginTop: 2,
  },
  form: { gap: 14, marginTop: 34 },
  fieldLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text.secondary,
  },
  field: {
    minHeight: 44,
    borderRadius: 14,
    borderColor: fieldBorder,
    backgroundColor: '#FDFAF4',
  },
  fieldInput: {
    minHeight: 42,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
  },
  visibilityButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    minHeight: 30,
    justifyContent: 'center',
    marginTop: -6,
  },
  forgotText: {
    fontFamily: fontFamilies.sansRegular,
    color: terracotta,
    fontSize: 11,
  },
  signInButton: {
    minHeight: 44,
    borderRadius: 13,
    borderColor: terracotta,
    backgroundColor: terracotta,
    marginTop: -4,
  },
  signUpButton: {
    minHeight: 44,
    borderRadius: 13,
    borderColor: fieldBorder,
    backgroundColor: '#FDFAF4',
  },
});
