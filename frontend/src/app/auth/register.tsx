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
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';

const background = '#F9F2E9';
const terracotta = '#AE5A37';
const fieldBorder = '#E3D2C2';
const validEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameError = submitted && !name.trim() ? 'Informe seu nome.' : undefined;
  const emailError =
    submitted && !validEmail(email) ? 'Informe um e-mail válido.' : undefined;
  const passwordError =
    submitted && password.length < 8
      ? 'A senha deve ter pelo menos 8 caracteres.'
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
      !validEmail(email) ||
      password.length < 8 ||
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
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
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
                  tintColor={colors.text.primary}
                />
              </View>
            </Pressable>
            <View>
              <Text style={styles.title}>Criar conta</Text>
              <Text style={styles.subtitle}>Leva menos de um minuto</Text>
            </View>
          </View>

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
                      tintColor={colors.text.auxiliary}
                    />
                  </View>
                )}
              </Pressable>
              <Text style={styles.photoInstruction}>
                {photoUrl
                  ? 'Toque no círculo para trocar a imagem.'
                  : 'Toque no círculo para escolher uma imagem.'}
              </Text>
            </View>
            <Text style={styles.optionalText}>
              Opcional — você pode adicionar depois
            </Text>
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
              onChangeText={setEmail}
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
              secureTextEntry
              value={password}
            />
            <AppTextField
              label="Confirmar senha"
              labelStyle={styles.fieldLabel}
              fieldStyle={styles.field}
              style={styles.fieldInput}
              autoComplete="new-password"
              error={confirmPasswordError}
              onChangeText={setConfirmPassword}
              secureTextEntry
              value={confirmPassword}
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
              title="Continuar"
              style={styles.continueButton}
              labelStyle={styles.continueLabel}
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
    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBF6',
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: '#9E7667',
  },
  photoSection: { marginBottom: 10 },
  sectionLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: terracotta,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  photoButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: fieldBorder,
    backgroundColor: '#FDFAF4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: { width: 72, height: 72, borderRadius: 36 },
  photoInstruction: {
    flex: 1,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    lineHeight: 15,
    color: '#9E7667',
  },
  optionalText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: '#9E7667',
    marginTop: 6,
  },
  form: { gap: 8 },
  fieldLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: terracotta,
  },
  field: {
    minHeight: 36,
    borderRadius: 14,
    borderColor: fieldBorder,
    backgroundColor: '#FDFAF4',
  },
  fieldInput: {
    minHeight: 32,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    paddingVertical: 4,
  },
  continueButton: {
    minHeight: 44,
    borderRadius: 13,
    borderColor: terracotta,
    backgroundColor: terracotta,
  },
  continueLabel: { fontSize: 12 },
});
