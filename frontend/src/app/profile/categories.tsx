import { router, useLocalSearchParams } from 'expo-router';
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
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import { mockCategoryService } from '@/services/mock/mock-category-service';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';
import type { Category } from '@/types/models';

type Notice = { variant: 'success' | 'error'; title: string; message?: string };

export default function CategoriesScreen() {
  const { created } = useLocalSearchParams<{ created?: string }>();
  const { user } = useAuth();
  const { compact, heroHeight, contentWidth } = useResponsiveLayout();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(
    created === '1'
      ? { variant: 'success', title: 'Categoria cadastrada' }
      : null,
  );
  const [query, setQuery] = useState('');
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    mockCategoryService
      .list(user.id)
      .then((items) => {
        if (mounted) {
          setCategories(items);
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

  const visibleCategories = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    return term
      ? categories.filter((item) =>
          item.name.toLocaleLowerCase('pt-BR').includes(term),
        )
      : categories;
  }, [categories, query]);

  function showError(cause: unknown) {
    setNotice({
      variant: 'error',
      title: 'Não foi possível concluir a ação',
      message: errorMessage(cause),
    });
  }

  async function retry() {
    if (!user || busy) return;
    setBusy(true);
    try {
      setCategories(await mockCategoryService.list(user.id));
      setLoadError(null);
    } catch (cause) {
      setLoadError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!user || !editTarget || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const updated = await mockCategoryService.update(
        user.id,
        editTarget.id,
        editName,
      );
      setCategories((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditTarget(null);
      setEditError(null);
      setNotice({ variant: 'success', title: 'Categoria atualizada' });
    } catch (cause) {
      setEditError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory() {
    if (!user || !deleteTarget || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      await mockCategoryService.remove(user.id, deleteTarget.id);
      setCategories((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setNotice({ variant: 'success', title: 'Categoria excluída' });
    } catch (cause) {
      setDeleteTarget(null);
      showError(cause);
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
                  Categorias
                </Text>
                <Text style={styles.count}>
                  {categories.length}{' '}
                  {categories.length === 1 ? 'cadastrada' : 'cadastradas'}
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
                accessibilityLabel="Buscar categorias"
                placeholder="Buscar"
                placeholderTextColor={colors.text.auxiliary}
                value={query}
                onChangeText={setQuery}
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Adicionar nova categoria"
              onPress={() => router.push('/profile/categories/new')}
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
                onDismiss={() => {
                  setNotice(null);
                  if (created === '1') router.setParams({ created: '' });
                }}
              />
            ) : null}
            {loading ? (
              <LoadingState message="Carregando categorias..." />
            ) : null}
            {!loading && loadError ? (
              <View style={styles.errorArea}>
                <AppFeedback
                  compact
                  variant="error"
                  title="Falha ao carregar categorias"
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
            {!loading && !loadError && categories.length === 0 ? (
              <EmptyState
                title="Nenhuma categoria cadastrada"
                message="Adicione sua primeira categoria para organizar as peças."
                actionLabel="Adicionar categoria"
                onAction={() => router.push('/profile/categories/new')}
              />
            ) : null}
            {!loading &&
            !loadError &&
            categories.length > 0 &&
            visibleCategories.length === 0 ? (
              <EmptyState
                title="Nenhuma categoria encontrada"
                message="Tente buscar por outro nome."
              />
            ) : null}
            {!loading && !loadError && visibleCategories.length > 0 ? (
              <View style={styles.categoryCard}>
                {visibleCategories.map((category, index) => (
                  <View
                    key={category.id}
                    style={[styles.categoryRow, index > 0 && styles.divider]}
                  >
                    <Text numberOfLines={1} style={styles.categoryName}>
                      {category.name}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ${category.name}`}
                      onPress={() => {
                        setEditTarget(category);
                        setEditName(category.name);
                        setEditError(null);
                      }}
                      style={styles.iconButton}
                    >
                      <SymbolView
                        name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                        size={15}
                        tintColor={colors.text.secondary}
                      />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Excluir ${category.name}`}
                      onPress={() => setDeleteTarget(category)}
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
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppModal
        visible={editTarget !== null}
        title="Editar categoria"
        titleStyle={styles.modalTitle}
        onClose={() => !busy && setEditTarget(null)}
      >
        <TextInput
          accessibilityLabel="Nome da categoria"
          value={editName}
          onChangeText={setEditName}
          maxLength={40}
          style={styles.modalInput}
        />
        {editError ? (
          <AppFeedback
            compact
            variant="error"
            title="Confira o nome"
            message={editError}
            onDismiss={() => setEditError(null)}
          />
        ) : null}
        <AppButton title="Salvar" loading={busy} onPress={saveEdit} />
      </AppModal>
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Excluir categoria?"
        message={`Deseja excluir ${deleteTarget?.name ?? 'esta categoria'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        loading={busy}
        onConfirm={deleteCategory}
        onCancel={() => !busy && setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Tente novamente.';
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
  categoryCard: {
    overflow: 'hidden',
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  categoryRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
    paddingRight: 9,
    gap: 7,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border.default },
  categoryName: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
  },
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
  modalInput: {
    height: 43,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: colors.text.primary,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
  },
});
