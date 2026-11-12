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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import { useAuth } from '@/features/auth/auth-context';
import { isValidEmail } from '@/features/auth/validation';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

export default function EditProfileScreen() {
  const { heroHeight, contentWidth, cardPadding } = useResponsiveLayout();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    variant: 'success' | 'error';
    title: string;
    message?: string;
  } | null>(null);

  const nameError = submitted && !name.trim() ? 'Informe seu nome.' : undefined;
  const emailError = submitted
    ? !email.trim()
      ? 'Informe seu e-mail.'
      : !isValidEmail(email)
        ? 'Informe um e-mail válido.'
        : undefined
    : undefined;
  const currentPasswordError =
    submitted && newPassword && !currentPassword
      ? 'Informe a senha atual.'
      : undefined;
  const newPasswordError =
    submitted && currentPassword
      ? !newPassword
        ? 'Informe a nova senha.'
        : newPassword.length < 8
          ? 'Use pelo menos 8 caracteres.'
          : undefined
      : undefined;

  async function handleSave() {
    setSubmitted(true);
    setNotice(null);
    if (
      !name.trim() ||
      !isValidEmail(email) ||
      ((currentPassword || newPassword) &&
        (!currentPassword || newPassword.length < 8))
    )
      return;
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword('');
      setNewPassword('');
      setSubmitted(false);
      setNotice({
        variant: 'success',
        title: 'Dados atualizados',
        message: 'Suas alterações foram salvas.',
      });
    } catch (cause) {
      setNotice({
        variant: 'error',
        title: 'Não foi possível salvar',
        message: cause instanceof Error ? cause.message : 'Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  }

  function passwordToggle(
    visible: boolean,
    onPress: () => void,
    label: string,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${visible ? 'Ocultar' : 'Mostrar'} ${label}`}
        onPress={onPress}
        style={styles.eyeButton}
      >
        <SymbolView
          name={
            visible
              ? { ios: 'eye', android: 'visibility', web: 'visibility' }
              : {
                  ios: 'eye.slash',
                  android: 'visibility_off',
                  web: 'visibility_off',
                }
          }
          size={17}
          tintColor={colors.text.secondary}
        />
      </Pressable>
    );
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
          <View style={[styles.hero, { height: heroHeight }]}>
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="Voltar para o perfil"
                accessibilityRole="button"
                onPress={() => router.replace('/profile')}
                style={styles.backButton}
              >
                <SymbolView
                  name={{
                    ios: 'chevron.left',
                    android: 'arrow_back',
                    web: 'arrow_back',
                  }}
                  size={18}
                  tintColor={colors.action.secondary}
                />
              </Pressable>
              <Text accessibilityRole="header" style={styles.title}>
                Meus dados
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.formArea,
              { width: contentWidth, marginTop: 90 - heroHeight },
            ]}
          >
            {notice ? (
              <AppFeedback
                compact
                variant={notice.variant}
                title={notice.title}
                message={notice.message}
                onDismiss={() => setNotice(null)}
              />
            ) : null}
            <View style={[styles.card, { padding: cardPadding }]}>
              <AppTextField
                label="Nome"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                error={nameError}
                labelStyle={styles.label}
                fieldStyle={styles.field}
                style={styles.input}
              />
              <AppTextField
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                error={emailError}
                labelStyle={styles.label}
                fieldStyle={styles.field}
                style={styles.input}
              />
              <Text style={styles.sectionTitle}>Alterar senha</Text>
              <AppTextField
                label="Senha atual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry={!showCurrentPassword}
                error={currentPasswordError}
                labelStyle={styles.label}
                fieldStyle={styles.field}
                style={styles.input}
                rightAccessory={passwordToggle(
                  showCurrentPassword,
                  () => setShowCurrentPassword((value) => !value),
                  'senha atual',
                )}
              />
              <AppTextField
                label="Nova senha"
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                secureTextEntry={!showNewPassword}
                error={newPasswordError}
                labelStyle={styles.label}
                fieldStyle={styles.field}
                style={styles.input}
                rightAccessory={passwordToggle(
                  showNewPassword,
                  () => setShowNewPassword((value) => !value),
                  'nova senha',
                )}
              />
              <AppButton
                title="Salvar"
                onPress={handleSave}
                loading={saving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 30 },
  hero: {
    width: '100%',
    backgroundColor: colors.surface.selected,
    paddingTop: 10,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 21,
    color: colors.text.primary,
  },
  formArea: { width: '90%', maxWidth: 420, gap: 11 },
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: 19,
    padding: 15,
    gap: 14,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  field: {
    minHeight: 36,
    borderColor: colors.border.default,
    borderRadius: 13,
  },
  input: { minHeight: 33, fontFamily: fontFamilies.sansRegular, fontSize: 11 },
  sectionTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 17,
    color: colors.text.primary,
    marginTop: 3,
  },
  eyeButton: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: { minHeight: 38, marginTop: 4, borderRadius: 12 },
});
