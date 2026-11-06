import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import { useAuth } from '@/features/auth/auth-context';
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';

export default function LoginScreen() {
  const { height } = useWindowDimensions();
  const heroHeight = Math.max(240, Math.round(height * 0.5));
  const cardOverlap = Math.min(110, Math.round(heroHeight * 0.3));
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
          <View
            style={[
              styles.hero,
              { minHeight: heroHeight, paddingBottom: cardOverlap + 20 },
            ]}
          >
            <View style={styles.logo}>
              <Image
                accessibilityLabel="Ícone do Quanto É"
                source={require('../../../assets/images/app-icon.png')}
                resizeMode="contain"
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.brandName}>Quanto É</Text>
            <Text style={styles.brandSubtitle}>Precificação de brechó</Text>
          </View>

          <View style={[styles.card, { marginTop: -cardOverlap }]}>
            <Text style={styles.welcomeTitle}>Bem-vinda de volta</Text>
            <Text style={styles.welcomeDescription}>
              Entre para continuar precificando as peças do seu brechó.
            </Text>

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
                leftAccessory={
                  <View pointerEvents="none" style={styles.emailIcon}>
                    <SymbolView
                      name={{
                        ios: 'envelope',
                        android: 'mail_outline',
                        web: 'mail_outline',
                      }}
                      size={16}
                      tintColor={colors.text.auxiliary}
                    />
                  </View>
                }
              />
              <AppTextField
                label="Senha"
                labelStyle={styles.fieldLabel}
                fieldStyle={styles.field}
                style={styles.fieldInput}
                autoComplete="current-password"
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                secureTextEntry={!passwordVisible}
                underlineColorAndroid="transparent"
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
                    <View pointerEvents="none">
                      <SymbolView
                        key={passwordVisible ? 'visible' : 'hidden'}
                        name={{
                          ios: passwordVisible ? 'eye.slash' : 'eye',
                          android: passwordVisible
                            ? 'visibility_off'
                            : 'visibility',
                          web: passwordVisible
                            ? 'visibility_off'
                            : 'visibility',
                        }}
                        size={16}
                        tintColor={colors.text.secondary}
                      />
                    </View>
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
                labelStyle={styles.signInLabel}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem conta? </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Criar conta"
              onPress={() => router.push('/auth/register')}
            >
              <Text style={styles.footerLink}>Criar conta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 32,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logo: { width: 48, height: 48, borderRadius: 15, overflow: 'hidden' },
  logoImage: { width: 48, height: 48 },
  brandName: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    lineHeight: 30,
    color: colors.brand.terracotta,
    textAlign: 'center',
    marginTop: 10,
  },
  brandSubtitle: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 3,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  welcomeTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.primary,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  form: { gap: 8, marginTop: 12 },
  fieldLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text.primary,
  },
  field: {
    minHeight: 36,
    borderRadius: 14,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
  },
  fieldInput: {
    minHeight: 32,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    paddingVertical: 4,
  },
  emailIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  visibilityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    minHeight: 28,
    justifyContent: 'center',
  },
  forgotText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.action.secondary,
  },
  signInButton: {
    minHeight: 38,
    borderRadius: 13,
    borderColor: colors.action.primary,
    backgroundColor: colors.action.primary,
    paddingVertical: 4,
  },
  signInLabel: { fontSize: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  footerLink: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    color: colors.text.primary,
  },
});
