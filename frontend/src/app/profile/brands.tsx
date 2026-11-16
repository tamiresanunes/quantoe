import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
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
import { AppModal } from '@/components/app-modal';
import { AppTextField } from '@/components/app-text-field';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
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

type Notice = { variant: 'success' | 'error'; title: string; message?: string };

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Tente novamente.';
}

function searchKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export default function BrandsScreen() {
  const { user } = useAuth();
  const { compact, heroHeight, contentWidth } = useResponsiveLayout();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState('');
  const [formTarget, setFormTarget] = useState<Brand | 'new' | null>(null);
  const [formName, setFormName] = useState('');
  const [formTier, setFormTier] = useState<BrandTier>('other');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    mockBrandService
      .list(user.id)
      .then((items) => {
        if (mounted) {
          setBrands(items);
          setLoadError(null);
        }
      })
      .catch((cause: unknown) => {
        if (mounted) setLoadError(errorMessage(cause));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  const groups = useMemo(() => {
    const term = searchKey(query.trim());
    return brandTiers
      .map((tier) => ({
        ...tier,
        brands: brands.filter(
          (brand) =>
            brand.tier === tier.id &&
            (!term ||
              searchKey(brand.name).includes(term) ||
              searchKey(tier.label).includes(term)),
        ),
      }))
      .filter((tier) => tier.brands.length > 0);
  }, [brands, query]);

  function openForm(target: Brand | 'new') {
    setFormTarget(target);
    setFormName(target === 'new' ? '' : target.name);
    setFormTier(target === 'new' ? 'other' : target.tier);
    setFormError(null);
  }

  async function retry() {
    if (!user || busy) return;
    setBusy(true);
    try {
      setBrands(await mockBrandService.list(user.id));
      setLoadError(null);
    } catch (cause) {
      setLoadError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function saveBrand() {
    if (!user || !formTarget || busy) return;
    if (!formName.trim()) {
      setFormError('Informe o nome da marca.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      if (formTarget === 'new') {
        const created = await mockBrandService.create(user.id, {
          name: formName,
          tier: formTier,
        });
        setBrands((current) => [...current, created]);
        setNotice({ variant: 'success', title: 'Marca cadastrada' });
      } else {
        const updated = await mockBrandService.update(user.id, formTarget.id, {
          name: formName,
          tier: formTier,
        });
        setBrands((current) =>
          current.map((brand) => (brand.id === updated.id ? updated : brand)),
        );
        setNotice({ variant: 'success', title: 'Marca atualizada' });
      }
      setFormTarget(null);
      setQuery('');
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function deleteBrand() {
    if (!user || !deleteTarget || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      await mockBrandService.remove(user.id, deleteTarget.id);
      setBrands((current) =>
        current.filter((brand) => brand.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setNotice({ variant: 'success', title: 'Marca excluída' });
    } catch (cause) {
      setDeleteTarget(null);
      setNotice({
        variant: 'error',
        title: 'Não foi possível excluir',
        message: errorMessage(cause),
      });
    } finally {
      setBusy(false);
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
                accessibilityLabel="Voltar para o perfil"
                hitSlop={6}
                onPress={() => router.replace('/profile')}
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
                  Marcas
                </Text>
                <Text style={styles.count}>
                  {brands.length}{' '}
                  {brands.length === 1 ? 'cadastrada' : 'cadastradas'}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.listArea,
              {
                width: contentWidth,
                marginTop: (compact ? 92 : 98) - heroHeight,
              },
            ]}
          >
            <View style={styles.searchBox}>
              <SymbolView
                name={{
                  ios: 'magnifyingglass',
                  android: 'search',
                  web: 'search',
                }}
                size={17}
                tintColor={colors.text.secondary}
              />
              <TextInput
                accessibilityLabel="Buscar marcas ou setores"
                placeholder="Buscar marcas"
                placeholderTextColor={colors.text.auxiliary}
                value={query}
                onChangeText={setQuery}
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Adicionar nova marca"
              hitSlop={3}
              onPress={() => openForm('new')}
              style={styles.addRow}
            >
              <View style={styles.addInput}>
                <Text style={styles.addPlaceholder}>Adicionar nova</Text>
              </View>
              <View style={styles.addButton}>
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  size={19}
                  tintColor={colors.text.inverse}
                />
              </View>
            </Pressable>

            {notice ? (
              <AppFeedback
                compact
                variant={notice.variant}
                title={notice.title}
                message={notice.message}
                onDismiss={() => setNotice(null)}
              />
            ) : null}
            {loading ? <LoadingState message="Carregando marcas..." /> : null}
            {!loading && loadError ? (
              <View style={styles.errorArea}>
                <AppFeedback
                  compact
                  variant="error"
                  title="Falha ao carregar marcas"
                  message={loadError}
                />
                <AppButton
                  title="Tentar novamente"
                  variant="secondary"
                  loading={busy}
                  onPress={retry}
                />
              </View>
            ) : null}
            {!loading && !loadError && groups.length === 0 ? (
              <EmptyState
                title="Nenhuma marca encontrada"
                message="Tente buscar por outro nome ou setor."
              />
            ) : null}
            {!loading && !loadError
              ? groups.map((tier) => (
                  <View key={tier.id} style={styles.group}>
                    <View style={styles.groupHeading}>
                      <Text
                        accessibilityRole="header"
                        style={styles.groupTitle}
                      >
                        {tier.label}
                      </Text>
                      <Text style={styles.points}>+{tier.points} pontos</Text>
                    </View>
                    <View style={styles.brandCard}>
                      {tier.brands.map((brand, index) => (
                        <View
                          key={brand.id}
                          style={[styles.brandRow, index > 0 && styles.divider]}
                        >
                          <Text numberOfLines={1} style={styles.brandName}>
                            {brand.name}
                          </Text>
                          {brand.isSystem ? (
                            <View
                              accessible
                              accessibilityLabel={`${brand.name}, marca padrão do sistema, não editável`}
                              style={styles.systemBadge}
                            >
                              <SymbolView
                                name={{
                                  ios: 'lock',
                                  android: 'lock',
                                  web: 'lock',
                                }}
                                size={12}
                                tintColor={colors.text.auxiliary}
                              />
                              <Text style={styles.systemLabel}>Padrão</Text>
                            </View>
                          ) : (
                            <View style={styles.rowActions}>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Editar ${brand.name}`}
                                hitSlop={6}
                                onPress={() => openForm(brand)}
                                style={styles.iconButton}
                              >
                                <SymbolView
                                  name={{
                                    ios: 'pencil',
                                    android: 'edit',
                                    web: 'edit',
                                  }}
                                  size={15}
                                  tintColor={colors.text.secondary}
                                />
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Excluir ${brand.name}`}
                                hitSlop={6}
                                onPress={() => setDeleteTarget(brand)}
                                style={styles.iconButton}
                              >
                                <SymbolView
                                  name={{
                                    ios: 'trash',
                                    android: 'delete',
                                    web: 'delete',
                                  }}
                                  size={15}
                                  tintColor={colors.semantic.error.foreground}
                                />
                              </Pressable>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppModal
        visible={formTarget !== null}
        title={formTarget === 'new' ? 'Nova marca' : 'Editar marca'}
        titleStyle={styles.modalTitle}
        onClose={() => !busy && setFormTarget(null)}
      >
        <AppTextField
          label="Nome da marca"
          placeholder="Ex.: Marca do brechó"
          value={formName}
          onChangeText={(value) => {
            setFormName(value);
            setFormError(null);
          }}
          maxLength={50}
          error={formError ?? undefined}
        />
        <View style={styles.tierSection}>
          <Text style={styles.tierLabel}>Setor</Text>
          <View style={styles.tierChoices}>
            {brandTiers.map((tier) => (
              <Pressable
                key={tier.id}
                accessibilityRole="button"
                accessibilityLabel={`${tier.label}, mais ${tier.points} pontos`}
                accessibilityState={{ selected: formTier === tier.id }}
                onPress={() => setFormTier(tier.id)}
                style={[
                  styles.tierChoice,
                  formTier === tier.id && styles.tierChoiceSelected,
                ]}
              >
                <Text
                  style={[
                    styles.tierChoiceText,
                    formTier === tier.id && styles.tierChoiceTextSelected,
                  ]}
                >
                  {tier.label} · +{tier.points}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.modalActions}>
          <AppButton
            title="Cancelar"
            variant="secondary"
            size="small"
            disabled={busy}
            onPress={() => setFormTarget(null)}
            style={styles.modalAction}
          />
          <AppButton
            title="Salvar"
            size="small"
            loading={busy}
            onPress={saveBrand}
            style={styles.modalAction}
          />
        </View>
      </AppModal>
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Excluir marca?"
        message={`Deseja excluir ${deleteTarget?.name ?? 'esta marca'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        loading={busy}
        onConfirm={deleteBrand}
        onCancel={() => !busy && setDeleteTarget(null)}
      />
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
  count: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.action.secondary,
  },
  listArea: { gap: 10, maxWidth: 420 },
  searchBox: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 14,
    backgroundColor: colors.surface.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    padding: 0,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    color: colors.text.primary,
  },
  addRow: { flexDirection: 'row', gap: 7 },
  addInput: {
    flex: 1,
    minWidth: 0,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 14,
    backgroundColor: colors.surface.primary,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  addPlaceholder: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    color: colors.text.auxiliary,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: { gap: 8, marginTop: 7 },
  groupHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
    gap: 8,
  },
  groupTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    fontSize: 16,
    color: colors.text.primary,
  },
  points: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.action.secondary,
  },
  brandCard: {
    overflow: 'hidden',
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  brandRow: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
    paddingRight: 9,
    gap: 7,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border.default },
  brandName: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
  },
  systemBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  systemLabel: {
    color: colors.text.auxiliary,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
  },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorArea: { gap: 10 },
  modalTitle: { fontFamily: fontFamilies.display, fontSize: 19 },
  tierSection: { gap: 8 },
  tierLabel: {
    color: colors.text.primary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  tierChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tierChoice: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 14,
    paddingHorizontal: 9,
    minHeight: 31,
    justifyContent: 'center',
  },
  tierChoiceSelected: {
    borderColor: colors.action.secondary,
    backgroundColor: colors.surface.selected,
  },
  tierChoiceText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  tierChoiceTextSelected: { color: colors.action.secondary },
  modalActions: { flexDirection: 'row', gap: 8 },
  modalAction: { flex: 1 },
});
