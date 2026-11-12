import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Image,
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
import { isValidEmail } from '@/features/auth/validation';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

export default function RegisterScreen() {
  const { compact, heroHeight, authCardWidth, cardPadding } =
    useResponsiveLayout();
  const cardTop = compact ? 90 : 104;
  const { signUp } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameError = submitted && !name.trim() ? 'Informe seu nome.' : undefined;
  const emailError = submitted
    ? !email.trim()
      ? 'Informe seu e-mail.'
      : !isValidEmail(email)
        ? 'Informe um e-mail válido.'
        : undefined
    : undefined;
  const passwordError = submitted
    ? !password.trim()
      ? 'Informe uma senha.'
      : password.trim().length < 8
        ? 'A senha deve ter pelo menos 8 caracteres.'
        : undefined
    : undefined;
  const confirmPasswordError =
    submitted && !confirmPassword
      ? 'Confirme sua senha.'
      : submitted && confirmPassword !== password
        ? 'As senhas não coincidem.'
        : undefined;

  async function handlePickPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUrl(result.assets[0].uri);
        setError('');
      }
    } catch {
      setError('Não foi possível escolher a foto. Tente novamente.');
    }
  }

  async function handleSignUp() {
    setSubmitted(true);
    setError('');
    if (
      !name.trim() ||
      !isValidEmail(email) ||
      password.trim().length < 8 ||
      !confirmPassword ||
      confirmPassword !== password
    ) {
      return;
    }

    setLoading(true);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        photoUrl,
      });
      router.replace('/stores/create');
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
              <View>
                <Text style={styles.title}>Criar conta</Text>
                <Text style={styles.subtitle}>Leva menos de um minuto</Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                width: authCardWidth,
                paddingHorizontal: cardPadding,
                marginTop: cardTop - heroHeight,
              },
            ]}
          >
            <View style={styles.photoSection}>
              <Text style={styles.sectionLabel}>Foto de perfil</Text>
              <View style={styles.photoRow}>
                <Pressable
                  accessibilityHint="Abre a biblioteca de imagens"
                  accessibilityLabel={
                    photoUrl
                      ? 'Alterar foto de perfil'
                      : 'Escolher foto de perfil'
                  }
                  accessibilityRole="button"
                  onPress={handlePickPhoto}
                  style={styles.photoButton}
                >
                  {photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.photoPreview}
                    />
                  ) : (
                    <View pointerEvents="none">
                      <SymbolView
                        name={{
                          ios: 'camera',
                          android: 'photo_camera',
                          web: 'photo_camera',
                        }}
                        size={20}
                        tintColor={colors.action.secondary}
                      />
                    </View>
                  )}
                </Pressable>
                <View style={styles.photoCopy}>
                  <Text style={styles.photoInstruction}>
                    {photoUrl
                      ? 'Toque no círculo para trocar a imagem.'
                      : 'Toque no círculo para escolher uma imagem.'}
                  </Text>
                  <Text style={styles.optionalText}>
                    Opcional — você pode adicionar depois
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.form}>
              <AppTextField
                label="Nome"
                labelStyle={styles.fieldLabel}
                fieldStyle={styles.field}
                style={styles.fieldInput}
                autoCapitalize="words"
                autoComplete="name"
                error={nameError}
                onChangeText={setName}
                placeholder="Seu nome"
                value={name}
              />
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
                }}
                placeholder="voce@email.com"
                value={email}
              />
              <AppTextField
                label="Senha"
                labelStyle={styles.fieldLabel}
                fieldStyle={styles.field}
                style={styles.fieldInput}
                autoComplete="new-password"
                error={passwordError}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
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
                    <View pointerEvents="none">
                      <SymbolView
                        key={passwordVisible ? 'visible' : 'hidden'}
                        name={{
                          ios: passwordVisible ? 'eye' : 'eye.slash',
                          android: passwordVisible
                            ? 'visibility'
                            : 'visibility_off',
                          web: passwordVisible
                            ? 'visibility'
                            : 'visibility_off',
                        }}
                        size={16}
                        tintColor={colors.text.secondary}
                      />
                    </View>
                  </Pressable>
                }
              />
              <AppTextField
                label="Confirmar senha"
                labelStyle={styles.fieldLabel}
                fieldStyle={styles.field}
                style={styles.fieldInput}
                autoComplete="new-password"
                error={confirmPasswordError}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                value={confirmPassword}
                rightAccessory={
                  <Pressable
                    accessibilityLabel={
                      confirmPasswordVisible
                        ? 'Ocultar confirmação de senha'
                        : 'Mostrar confirmação de senha'
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: confirmPasswordVisible }}
                    hitSlop={8}
                    onPress={() =>
                      setConfirmPasswordVisible((visible) => !visible)
                    }
                    style={styles.visibilityButton}
                  >
                    <View pointerEvents="none">
                      <SymbolView
                        key={confirmPasswordVisible ? 'visible' : 'hidden'}
                        name={{
                          ios: confirmPasswordVisible ? 'eye' : 'eye.slash',
                          android: confirmPasswordVisible
                            ? 'visibility'
                            : 'visibility_off',
                          web: confirmPasswordVisible
                            ? 'visibility'
                            : 'visibility_off',
                        }}
                        size={16}
                        tintColor={colors.text.secondary}
                      />
                    </View>
                  </Pressable>
                }
              />

              {error ? (
                <View style={styles.noticeSlot}>
                  <AppFeedback
                    compact
                    variant="error"
                    title="Não foi possível criar a conta"
                    message={error}
                    onDismiss={() => setError('')}
                  />
                </View>
              ) : null}

              <AppButton
                loading={loading}
                onPress={handleSignUp}
                title="Continuar"
                style={styles.continueButton}
                labelStyle={styles.continueLabel}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Entrar"
              onPress={() => router.replace('/auth/login')}
            >
              <Text style={styles.footerLink}>Entrar</Text>
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
    paddingBottom: 8,
  },
  hero: {
    width: '100%',
    paddingTop: 40,
    paddingHorizontal: 17,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.action.secondary,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  photoSection: { marginBottom: 16 },
  sectionLabel: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.action.secondary,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  photoButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.selected,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: { width: 64, height: 64, borderRadius: 32 },
  photoCopy: { flex: 1, gap: 4 },
  photoInstruction: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
    lineHeight: 13,
    color: colors.text.secondary,
  },
  optionalText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
    lineHeight: 13,
    color: colors.text.secondary,
  },
  form: { gap: 8 },
  noticeSlot: { marginVertical: spacing.xxs },
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
  visibilityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  continueButton: {
    minHeight: 38,
    borderRadius: 13,
    borderColor: colors.action.primary,
    backgroundColor: colors.action.primary,
    paddingVertical: 4,
  },
  continueLabel: { fontSize: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
