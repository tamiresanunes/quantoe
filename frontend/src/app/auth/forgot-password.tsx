import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
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
import { isValidEmail } from '@/features/auth/validation';
import { authService } from '@/services';
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';

export default function ForgotPasswordScreen() {
  const { height } = useWindowDimensions();
  const heroHeight = Math.round(height * 0.3);
  const cardTop = height < 650 ? 145 : 150;
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const emailError = submitted
    ? !email.trim()
      ? 'Informe seu e-mail.'
      : !isValidEmail(email)
        ? 'Informe um e-mail válido.'
        : undefined
    : undefined;

  async function handleSendLink() {
    setSubmitted(true);
    setError('');
    setSuccess(false);
    if (!isValidEmail(email)) return;

    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim().toLowerCase());
      setSuccess(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível solicitar a recuperação.',
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
          <View style={[styles.hero, { minHeight: heroHeight }]}>
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="Voltar para login"
                accessibilityRole="button"
                onPress={() => router.replace('/auth/login')}
                style={styles.backButton}
              >
                <View pointerEvents="none">
                  <SymbolView
                    name={{
                      ios: 'chevron.left',
                      android: 'arrow_back',
                      web: 'arrow_back',
                    }}
                    size={18}
                    tintColor={colors.action.secondary}
                  />
                </View>
              </Pressable>
              <Text style={styles.title}>Recuperar senha</Text>
            </View>

            <Text style={styles.description}>
              Informe o e-mail cadastrado. Enviaremos um link para você criar
              uma nova senha.
            </Text>
          </View>

          <View style={[styles.card, { marginTop: cardTop - heroHeight }]}>
            <AppTextField
              label="E-mail"
              labelStyle={styles.fieldLabel}
              fieldStyle={styles.field}
              style={styles.fieldInput}
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                setError('');
                setSuccess(false);
              }}
              onSubmitEditing={() => void handleSendLink()}
              placeholder="tamires@brechoraiz.com"
              returnKeyType="send"
              value={email}
            />

            {error ? (
              <AppFeedback
                compact
                variant="error"
                title="Não foi possível enviar o link"
                message={error}
                onDismiss={() => setError('')}
              />
            ) : null}
            {success ? (
              <AppFeedback
                compact
                variant="success"
                title="Solicitação recebida"
                message="Demonstração: nenhum e-mail foi enviado."
                onDismiss={() => setSuccess(false)}
              />
            ) : null}

            <AppButton
              loading={loading}
              onPress={handleSendLink}
              title="Enviar link"
              style={styles.sendButton}
              labelStyle={styles.sendLabel}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <Pressable
              accessibilityLabel="Criar conta"
              accessibilityRole="button"
              onPress={() => router.replace('/auth/register')}
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
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 24 },
  hero: {
    width: '100%',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.primary,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 21,
    lineHeight: 27,
    color: colors.text.primary,
  },
  description: {
    maxWidth: 390,
    marginTop: 28,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.text.secondary,
  },
  card: {
    width: '88%',
    maxWidth: 404,
    alignSelf: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.12,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fieldLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  field: {
    minHeight: 36,
    borderRadius: 13,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
  },
  fieldInput: {
    minHeight: 32,
    fontSize: 11,
    paddingVertical: 4,
  },
  sendButton: {
    minHeight: 40,
    borderRadius: 13,
    borderColor: colors.action.primary,
    backgroundColor: colors.action.primary,
    paddingVertical: 4,
  },
  sendLabel: { fontSize: 12 },
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
    color: colors.action.secondary,
  },
});
