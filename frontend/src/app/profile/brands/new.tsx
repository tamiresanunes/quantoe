import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import {
  brandTiers,
  type Brand,
  type BrandTier,
} from '@/features/brands/brand-types';
import { mockBrandService } from '@/services/mock/mock-brand-service';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

function parseCurrency(value: string): number | null {
  const trimmed = value.trim();
  const grouped = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(trimmed);
  const simple = /^\d+(?:[.,]\d{1,2})?$/.test(trimmed);
  if (!grouped && !simple) return null;
  const normalized = grouped
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1_000_000_000
    ? parsed
    : null;
}

function formatCurrency(value: number | undefined) {
  return value === undefined ? '' : String(value).replace('.', ',');
}

export default function BrandFormScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { user } = useAuth();
  const { compact, heroHeight, contentWidth, cardPadding } =
    useResponsiveLayout();
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [country, setCountry] = useState('');
  const [tier, setTier] = useState<BrandTier>('other');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedRange, setFocusedRange] = useState<'min' | 'max' | null>(null);

  useEffect(() => {
    if (!editId || !user) return;
    let mounted = true;
    mockBrandService
      .list(user.id)
      .then((items) => {
        if (!mounted) return;
        const brand = items.find(
          (item) => item.id === editId && !item.isSystem,
        );
        if (!brand) {
          setLoadError('Marca não encontrada ou não editável.');
          return;
        }
        setEditingBrand(brand);
        setName(brand.name);
        setMinValue(formatCurrency(brand.minValue));
        setMaxValue(formatCurrency(brand.maxValue));
        setCountry(brand.country ?? '');
        setTier(brand.tier);
      })
      .catch((cause: unknown) => {
        if (mounted) {
          setLoadError(
            cause instanceof Error ? cause.message : 'Tente novamente.',
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [editId, user]);

  const parsedMin = parseCurrency(minValue);
  const parsedMax = parseCurrency(maxValue);
  const rangeValid =
    parsedMin !== null && parsedMax !== null && parsedMin <= parsedMax;

  async function save() {
    if (!user || saving || (editId && !editingBrand)) return;
    setSubmitted(true);
    setError(null);
    if (
      !name.trim() ||
      !country.trim() ||
      parsedMin === null ||
      parsedMax === null ||
      parsedMin > parsedMax
    )
      return;
    setSaving(true);
    try {
      const input = {
        name,
        minValue: parsedMin,
        maxValue: parsedMax,
        country,
        tier,
      };
      if (editingBrand) {
        await mockBrandService.update(user.id, editingBrand.id, input);
      } else {
        await mockBrandService.create(user.id, input);
      }
      router.replace({
        pathname: '/profile/brands',
        params: { saved: editingBrand ? 'updated' : 'created' },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, { height: heroHeight }]}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar para marcas"
                hitSlop={6}
                onPress={() => router.replace('/profile/brands')}
                style={styles.backButton}
              >
                <SymbolView
                  name={{
                    ios: 'chevron.left',
                    android: 'arrow_back',
                    web: 'arrow_back',
                  }}
                  size={17}
                  tintColor={colors.action.secondary}
                />
              </Pressable>
              <View style={styles.headerText}>
                <Text accessibilityRole="header" style={styles.title}>
                  {editId ? 'Editar marca' : 'Nova marca'}
                </Text>
                <Text style={styles.kicker}>
                  {editId ? 'Edição' : 'Cadastro'}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                width: contentWidth,
                padding: cardPadding,
                marginTop: (compact ? 99 : 103) - heroHeight,
              },
            ]}
          >
            {loading ? <LoadingState message="Carregando marca..." /> : null}
            {!loading && loadError ? (
              <>
                <AppFeedback
                  compact
                  variant="error"
                  title="Não foi possível abrir a marca"
                  message={loadError}
                />
                <AppButton
                  title="Voltar para marcas"
                  variant="secondary"
                  onPress={() => router.replace('/profile/brands')}
                />
              </>
            ) : null}
            {!loading && !loadError ? (
              <>
                <AppTextField
                  label="Nome da marca"
                  placeholder="Ex.: Marca do brechó"
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                  autoCapitalize="words"
                  error={
                    submitted && !name.trim()
                      ? 'Informe o nome da marca.'
                      : undefined
                  }
                />

                <View style={styles.section}>
                  <Text style={styles.label}>Faixa de valorização (R$)</Text>
                  <View style={styles.rangeRow}>
                    <TextInput
                      accessibilityLabel="Valor mínimo em reais"
                      accessibilityHint="Use reais e centavos, por exemplo 100,50"
                      placeholder="Mín."
                      placeholderTextColor={colors.text.auxiliary}
                      keyboardType="decimal-pad"
                      value={minValue}
                      onChangeText={setMinValue}
                      onFocus={() => setFocusedRange('min')}
                      onBlur={() => setFocusedRange(null)}
                      maxLength={16}
                      style={[
                        styles.rangeInput,
                        focusedRange === 'min' && styles.rangeFocused,
                        submitted && !rangeValid && styles.rangeInvalid,
                      ]}
                    />
                    <Text style={styles.rangeDash}>–</Text>
                    <TextInput
                      accessibilityLabel="Valor máximo em reais"
                      accessibilityHint="Use reais e centavos, por exemplo 200,00"
                      placeholder="Máx."
                      placeholderTextColor={colors.text.auxiliary}
                      keyboardType="decimal-pad"
                      value={maxValue}
                      onChangeText={setMaxValue}
                      onFocus={() => setFocusedRange('max')}
                      onBlur={() => setFocusedRange(null)}
                      maxLength={16}
                      style={[
                        styles.rangeInput,
                        focusedRange === 'max' && styles.rangeFocused,
                        submitted && !rangeValid && styles.rangeInvalid,
                      ]}
                    />
                  </View>
                  {submitted && !rangeValid ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {parsedMin !== null && parsedMax !== null
                        ? 'O valor máximo deve ser igual ou maior que o mínimo.'
                        : 'Informe valores válidos em reais.'}
                    </Text>
                  ) : (
                    <Text style={styles.hint}>
                      Valores típicos de revenda das peças dessa marca
                    </Text>
                  )}
                </View>

                <AppTextField
                  label="País de origem"
                  placeholder="Ex.: Brasil"
                  value={country}
                  onChangeText={setCountry}
                  maxLength={60}
                  autoCapitalize="words"
                  error={
                    submitted && !country.trim()
                      ? 'Informe o país de origem.'
                      : undefined
                  }
                />

                <View style={styles.section}>
                  <Text style={styles.label}>Classificação</Text>
                  <View style={styles.tierChoices}>
                    {brandTiers.map((option) => (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${option.label}, mais ${option.points} pontos`}
                        accessibilityState={{ selected: tier === option.id }}
                        onPress={() => setTier(option.id)}
                        style={[
                          styles.tierChoice,
                          option.id === 'other' && styles.tierChoiceWide,
                          tier === option.id && styles.tierChoiceSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tierText,
                            tier === option.id && styles.tierTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.hint}>
                    Cada marca tem apenas uma classificação
                  </Text>
                </View>

                {error ? (
                  <AppFeedback
                    compact
                    variant="error"
                    title="Não foi possível salvar"
                    message={error}
                    onDismiss={() => setError(null)}
                  />
                ) : null}

                <View style={styles.actions}>
                  <AppButton
                    title={editingBrand ? 'Salvar alterações' : 'Salvar marca'}
                    loading={saving}
                    onPress={save}
                  />
                  <AppButton
                    title="Cancelar"
                    variant="secondary"
                    disabled={saving}
                    onPress={() => router.replace('/profile/brands')}
                  />
                </View>
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 32 },
  hero: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 11,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.primary,
  },
  kicker: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.action.secondary,
  },
  card: {
    maxWidth: 420,
    gap: 17,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  section: { gap: 8 },
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rangeInput: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 13,
    backgroundColor: colors.surface.primary,
    paddingHorizontal: 10,
    outlineWidth: 0,
    outlineColor: 'transparent',
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    color: colors.text.primary,
  },
  rangeFocused: { borderColor: colors.border.selected },
  rangeInvalid: { borderColor: colors.semantic.error.foreground },
  rangeDash: { color: colors.text.secondary, fontSize: 16 },
  hint: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  errorText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.semantic.error.foreground,
  },
  tierChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tierChoice: {
    width: '48%',
    minHeight: 36,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tierChoiceWide: { width: '100%' },
  tierChoiceSelected: {
    borderColor: colors.action.secondary,
    backgroundColor: colors.surface.selected,
  },
  tierText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  tierTextSelected: { color: colors.action.secondary },
  actions: { gap: 9 },
});
