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
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppSelect } from '@/components/app-select';
import { AppTextField } from '@/components/app-text-field';
import { useAuth } from '@/features/auth/auth-context';
import { cityOptions, states } from '@/features/stores/brazil-locations';
import { storeService } from '@/services';
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';

export default function CreateStoreScreen() {
  const { height } = useWindowDimensions();
  const heroHeight = Math.max(285, Math.round(height * 0.5));
  const { user, signOut } = useAuth();
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePickLogo() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setLogoUrl(result.assets[0].uri);
        setError('');
      }
    } catch {
      setError('Não foi possível escolher o logo. Tente novamente.');
    }
  }

  async function handleSave() {
    setSubmitted(true);
    setError('');
    if (!user || !name.trim() || !state || !city) return;

    setLoading(true);
    try {
      await storeService.create({
        ownerId: user.id,
        name: name.trim(),
        state,
        city,
        logoUrl,
      });
      router.replace({ pathname: '/stores', params: { storeCreated: '1' } });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar a loja.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    await signOut();
    router.replace('/auth/login');
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
            <Text style={styles.title}>Sua loja</Text>
            <Text style={styles.subtitle}>
              Etapa obrigatória do primeiro acesso
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { marginTop: -Math.min(130, heroHeight * 0.45) },
            ]}
          >
            <View style={styles.intro}>
              <View pointerEvents="none">
                <SymbolView
                  name={{
                    ios: 'storefront',
                    android: 'storefront',
                    web: 'storefront',
                  }}
                  size={20}
                  tintColor={colors.action.secondary}
                />
              </View>
              <Text style={styles.introText}>
                Cadastre o brechó para organizar estoque e preços por loja.
              </Text>
            </View>

            <View style={styles.logoSection}>
              <Text style={styles.logoLabel}>Logo da loja (opcional)</Text>
              <View style={styles.logoRow}>
                <Pressable
                  accessibilityLabel={
                    logoUrl ? 'Alterar logo da loja' : 'Escolher logo da loja'
                  }
                  accessibilityRole="button"
                  onPress={handlePickLogo}
                  style={styles.logoButton}
                >
                  {logoUrl ? (
                    <Image
                      source={{ uri: logoUrl }}
                      style={styles.logoPreview}
                    />
                  ) : (
                    <View pointerEvents="none">
                      <SymbolView
                        name={{
                          ios: 'photo',
                          android: 'add_photo_alternate',
                          web: 'add_photo_alternate',
                        }}
                        size={20}
                        tintColor={colors.action.secondary}
                      />
                    </View>
                  )}
                </Pressable>
                <Text style={styles.logoHint}>
                  Toque no círculo para escolher uma imagem.
                </Text>
              </View>
            </View>

            <View style={styles.fields}>
              <AppTextField
                label="Nome da loja"
                labelStyle={styles.fieldLabel}
                fieldStyle={styles.field}
                style={styles.fieldInput}
                autoCapitalize="words"
                error={
                  submitted && !name.trim()
                    ? 'Informe o nome da loja.'
                    : undefined
                }
                onChangeText={setName}
                placeholder="Ex.: Brechó Raiz"
                value={name}
              />
              <AppSelect
                compact
                label="Estado"
                error={submitted && !state ? 'Selecione o estado.' : undefined}
                onChange={(value) => {
                  setState(value);
                  setCity('');
                }}
                options={states.map((item) => ({ ...item }))}
                placeholder="Selecione o estado"
                value={state}
              />
              <AppSelect
                compact
                searchable
                label="Cidade"
                disabled={!state}
                error={submitted && !city ? 'Selecione a cidade.' : undefined}
                onChange={setCity}
                options={cityOptions(state)}
                placeholder={
                  state ? 'Selecione a cidade' : 'Escolha primeiro o estado'
                }
                value={city}
              />
            </View>

            {error ? (
              <AppFeedback
                compact
                variant="error"
                title="Não foi possível salvar a loja"
                message={error}
                onDismiss={() => setError('')}
              />
            ) : null}

            <View style={styles.actions}>
              <AppButton
                loading={loading}
                onPress={handleSave}
                title="Salvar loja"
                style={styles.saveButton}
                labelStyle={styles.buttonLabel}
              />
              <AppButton
                disabled={loading}
                onPress={handleCancel}
                title="Cancelar"
                variant="ghost"
                style={styles.cancelButton}
                labelStyle={styles.buttonLabel}
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
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 28 },
  hero: {
    width: '100%',
    paddingHorizontal: 18,
    paddingTop: 16,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 21,
    lineHeight: 27,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.action.secondary,
  },
  card: {
    width: '90%',
    maxWidth: 420,
    gap: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  introText: {
    flex: 1,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  logoSection: { gap: 6 },
  logoLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.selected,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoPreview: { width: 56, height: 56, borderRadius: 28 },
  logoHint: {
    flex: 1,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  fields: { gap: 12 },
  fieldLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  field: {
    minHeight: 38,
    borderRadius: 13,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
  },
  fieldInput: { minHeight: 34, fontSize: 11, paddingVertical: 4 },
  actions: { gap: 8 },
  saveButton: {
    minHeight: 40,
    borderRadius: 13,
    borderColor: colors.action.primary,
    backgroundColor: colors.action.primary,
    paddingVertical: 4,
  },
  cancelButton: { minHeight: 36, paddingVertical: 4 },
  buttonLabel: { fontSize: 12 },
});
