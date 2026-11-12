import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import { useStores } from '@/features/stores/store-context';
import {
  stockCategories,
  type StockCategory,
  type StockPreferences,
} from '@/features/stores/stock-preferences';
import { storeService } from '@/services';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

type PreferencesDraft = {
  defaultMinimum: string;
  minimumByCategory: Record<StockCategory, string>;
  lowStockAlerts: boolean;
  idlePieceAlerts: boolean;
  idleDays: string;
};

type Notice = { variant: 'success' | 'error'; title: string; message?: string };

function toDraft(preferences: StockPreferences): PreferencesDraft {
  return {
    defaultMinimum: String(preferences.defaultMinimum),
    minimumByCategory: {
      Casacos: String(preferences.minimumByCategory.Casacos),
      Vestidos: String(preferences.minimumByCategory.Vestidos),
      Calças: String(preferences.minimumByCategory.Calças),
      Camisas: String(preferences.minimumByCategory.Camisas),
      Acessórios: String(preferences.minimumByCategory.Acessórios),
    },
    lowStockAlerts: preferences.lowStockAlerts,
    idlePieceAlerts: preferences.idlePieceAlerts,
    idleDays: String(preferences.idleDays),
  };
}

function validNumber(value: string, min: number, max: number) {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  const number = Number(trimmed);
  return Number.isInteger(number) && number >= min && number <= max;
}

export default function StockPreferencesScreen() {
  const { compact, heroHeight, contentWidth, cardPadding } =
    useResponsiveLayout();
  const cardTop = compact ? 90 : 104;
  const { user } = useAuth();
  const { activeStore, loading: storesLoading } = useStores();
  const ownerId = user?.id;
  const storeId = activeStore?.id;
  const [draft, setDraft] = useState<PreferencesDraft | null>(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [focusedCategory, setFocusedCategory] = useState<StockCategory | null>(
    null,
  );
  const requestKey =
    ownerId && storeId ? `${ownerId}:${storeId}:${reloadKey}` : '';

  useEffect(() => {
    if (!ownerId || !storeId) return;
    let mounted = true;
    void storeService
      .getStockPreferences(ownerId, storeId)
      .then((preferences) => {
        if (!mounted) return;
        setDraft(toDraft(preferences));
        setLoadError('');
        setNotice(null);
        setSubmitted(false);
        setLoadedKey(requestKey);
      })
      .catch((cause) => {
        if (!mounted) return;
        setLoadError(
          cause instanceof Error
            ? cause.message
            : 'Não foi possível carregar as preferências.',
        );
        setLoadedKey(requestKey);
      });
    return () => {
      mounted = false;
    };
  }, [ownerId, storeId, requestKey]);

  function changeDraft(change: Partial<PreferencesDraft>) {
    setDraft((current) => (current ? { ...current, ...change } : current));
    setNotice(null);
  }

  function changeCategory(category: StockCategory, value: string) {
    setDraft((current) =>
      current
        ? {
            ...current,
            minimumByCategory: {
              ...current.minimumByCategory,
              [category]: value,
            },
          }
        : current,
    );
    setNotice(null);
  }

  async function handleSave() {
    if (!draft || !ownerId || !storeId) return;
    setSubmitted(true);
    setNotice(null);
    const invalid =
      !validNumber(draft.defaultMinimum, 0, 999) ||
      stockCategories.some(
        (category) => !validNumber(draft.minimumByCategory[category], 0, 999),
      ) ||
      !validNumber(draft.idleDays, 1, 3650);
    if (invalid) {
      setNotice({
        variant: 'error',
        title: 'Confira os valores',
        message: 'Use números inteiros nos limites indicados.',
      });
      return;
    }

    setSaving(true);
    try {
      const saved = await storeService.saveStockPreferences(ownerId, storeId, {
        defaultMinimum: Number(draft.defaultMinimum),
        minimumByCategory: {
          Casacos: Number(draft.minimumByCategory.Casacos),
          Vestidos: Number(draft.minimumByCategory.Vestidos),
          Calças: Number(draft.minimumByCategory.Calças),
          Camisas: Number(draft.minimumByCategory.Camisas),
          Acessórios: Number(draft.minimumByCategory.Acessórios),
        },
        lowStockAlerts: draft.lowStockAlerts,
        idlePieceAlerts: draft.idlePieceAlerts,
        idleDays: Number(draft.idleDays),
      });
      setDraft(toDraft(saved));
      setSubmitted(false);
      setNotice({
        variant: 'success',
        title: 'Preferências salvas',
        message: `Regras atualizadas para ${activeStore?.name}.`,
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

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
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
              <View style={styles.heading}>
                <Text accessibilityRole="header" style={styles.title}>
                  Preferências
                </Text>
                <Text style={styles.subtitle}>Regras de estoque</Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                width: contentWidth,
                padding: cardPadding,
                marginTop: cardTop - heroHeight,
              },
            ]}
          >
            {storesLoading || (activeStore && loadedKey !== requestKey) ? (
              <LoadingState message="Carregando preferências..." />
            ) : !activeStore ? (
              <EmptyState
                title="Nenhuma loja ativa"
                message="Selecione ou cadastre uma loja para definir as regras de estoque."
                actionLabel="Minhas lojas"
                onAction={() => router.replace('/stores')}
              />
            ) : loadError ? (
              <View style={styles.feedbackBlock}>
                <AppFeedback
                  compact
                  variant="error"
                  title="Falha ao carregar preferências"
                  message={loadError}
                />
                <AppButton
                  title="Tentar novamente"
                  variant="secondary"
                  onPress={() => setReloadKey((key) => key + 1)}
                />
              </View>
            ) : draft ? (
              <>
                <Text style={styles.storeLabel} numberOfLines={1}>
                  Loja ativa: {activeStore.name}
                </Text>
                <AppTextField
                  label="Estoque mínimo padrão"
                  value={draft.defaultMinimum}
                  onChangeText={(value) =>
                    changeDraft({ defaultMinimum: value })
                  }
                  keyboardType="number-pad"
                  maxLength={10}
                  error={
                    submitted && !validNumber(draft.defaultMinimum, 0, 999)
                      ? 'Informe um número de 0 a 999.'
                      : undefined
                  }
                  labelStyle={styles.fieldLabel}
                  fieldStyle={styles.field}
                  style={styles.input}
                />

                <Text style={styles.sectionTitle}>Mínimo por categoria</Text>
                <View style={styles.categoryList}>
                  {stockCategories.map((category, index) => {
                    const invalid =
                      submitted &&
                      !validNumber(draft.minimumByCategory[category], 0, 999);
                    return (
                      <View
                        key={category}
                        style={[
                          styles.categoryRow,
                          index > 0 && styles.categoryDivider,
                        ]}
                      >
                        <Text style={styles.categoryName}>{category}</Text>
                        <TextInput
                          accessibilityLabel={`Mínimo para ${category}`}
                          accessibilityHint={
                            invalid
                              ? 'Informe um número de 0 a 999.'
                              : undefined
                          }
                          keyboardType="number-pad"
                          maxLength={10}
                          onChangeText={(value) =>
                            changeCategory(category, value)
                          }
                          onFocus={() => setFocusedCategory(category)}
                          onBlur={() => setFocusedCategory(null)}
                          selectTextOnFocus
                          selectionColor={colors.brand.terracotta}
                          style={[
                            styles.categoryInput,
                            focusedCategory === category && styles.focusedField,
                            invalid && styles.invalidField,
                          ]}
                          value={draft.minimumByCategory[category]}
                        />
                      </View>
                    );
                  })}
                </View>
                {submitted &&
                stockCategories.some(
                  (category) =>
                    !validNumber(draft.minimumByCategory[category], 0, 999),
                ) ? (
                  <Text accessibilityRole="alert" style={styles.errorText}>
                    Preencha os mínimos das categorias com números de 0 a 999.
                  </Text>
                ) : null}

                <View style={styles.toggles}>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>
                      Alertar estoque baixo
                    </Text>
                    <Switch
                      accessibilityLabel="Alertar estoque baixo"
                      value={draft.lowStockAlerts}
                      onValueChange={(value) =>
                        changeDraft({ lowStockAlerts: value })
                      }
                      trackColor={{
                        false: colors.border.default,
                        true: colors.action.primary,
                      }}
                      thumbColor={colors.text.inverse}
                      style={styles.switch}
                    />
                  </View>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>
                      Alertar peças paradas
                    </Text>
                    <Switch
                      accessibilityLabel="Alertar peças paradas"
                      value={draft.idlePieceAlerts}
                      onValueChange={(value) =>
                        changeDraft({ idlePieceAlerts: value })
                      }
                      trackColor={{
                        false: colors.border.default,
                        true: colors.action.primary,
                      }}
                      thumbColor={colors.text.inverse}
                      style={styles.switch}
                    />
                  </View>
                </View>

                <AppTextField
                  label="Considerar parada após (dias)"
                  value={draft.idleDays}
                  onChangeText={(value) => changeDraft({ idleDays: value })}
                  keyboardType="number-pad"
                  maxLength={10}
                  error={
                    submitted && !validNumber(draft.idleDays, 1, 3650)
                      ? 'Informe de 1 a 3650 dias.'
                      : undefined
                  }
                  labelStyle={styles.fieldLabel}
                  fieldStyle={styles.field}
                  style={styles.input}
                />

                {notice ? (
                  <AppFeedback
                    compact
                    variant={notice.variant}
                    title={notice.title}
                    message={notice.message}
                    onDismiss={() => setNotice(null)}
                  />
                ) : null}
                <AppButton
                  title="Salvar preferências"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.saveButton}
                />
              </>
            ) : null}
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
    paddingTop: 11,
    paddingHorizontal: 14,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 23,
    borderBottomRightRadius: 23,
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
  heading: { gap: 1 },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 21,
    lineHeight: 27,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.action.secondary,
  },
  card: {
    maxWidth: 420,
    gap: 15,
    borderRadius: 19,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.12,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  storeLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    color: colors.action.secondary,
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
  input: { minHeight: 33, fontFamily: fontFamilies.sansRegular, fontSize: 11 },
  sectionTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text.primary,
    marginTop: 2,
  },
  categoryList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
  },
  categoryRow: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryDivider: { borderTopWidth: 1, borderTopColor: colors.border.default },
  categoryName: {
    flex: 1,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.primary,
  },
  categoryInput: {
    width: 53,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 0,
    outlineColor: 'transparent',
    outlineWidth: 0,
  },
  focusedField: { borderColor: colors.border.selected, borderWidth: 2 },
  invalidField: { borderColor: colors.semantic.error.foreground },
  errorText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.semantic.error.foreground,
    marginTop: -9,
  },
  toggles: { gap: 2 },
  toggleRow: {
    minHeight: 37,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.primary,
  },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  feedbackBlock: { gap: 12 },
  saveButton: { minHeight: 40, borderRadius: 13, marginTop: 3 },
});
