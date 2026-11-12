import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppFeedback } from '@/components/app-feedback';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import { EditStoreModal } from '@/features/stores/edit-store-modal';
import { useStores } from '@/features/stores/store-context';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';
import type { Store } from '@/types/models';

type Notice = {
  variant: 'success' | 'error';
  title: string;
  message?: string;
};

export default function StoresScreen() {
  const { storeCreated, loggedIn } = useLocalSearchParams<{
    storeCreated?: string;
    loggedIn?: string;
  }>();
  const { compact, heroHeight, contentWidth } = useResponsiveLayout();
  const listTop = compact ? 88 : 96;
  const { user } = useAuth();
  const {
    stores,
    activeStore,
    activePieces,
    loading,
    error: loadError,
    refresh,
    activateStore,
    removeStore,
  } = useStores();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);
  const [editTarget, setEditTarget] = useState<Store | null>(null);
  const [busy, setBusy] = useState(false);

  async function retryLoadingStores() {
    setBusy(true);
    try {
      await refresh();
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  function handleEditedStore(updated: Store) {
    setEditTarget(null);
    setNotice({
      variant: 'success',
      title: 'Loja atualizada',
      message: `As alterações em ${updated.name} foram salvas.`,
    });
  }

  function showError(cause: unknown) {
    setNotice({
      variant: 'error',
      title: 'Não foi possível concluir a ação',
      message: cause instanceof Error ? cause.message : 'Tente novamente.',
    });
  }

  async function handleActivate(store: Store) {
    if (!user || store.isActive || busy) return;
    setBusy(true);
    try {
      await activateStore(store.id);
      setNotice({
        variant: 'success',
        title: 'Loja ativa alterada',
        message: `${store.name} está ativa agora.`,
      });
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!user || !deleteTarget) return;
    setBusy(true);
    try {
      await removeStore(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({
        variant: 'success',
        title: 'Loja excluída',
        message: 'A loja foi removida da sua lista.',
      });
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.hero, { minHeight: heroHeight }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Voltar para o perfil"
              accessibilityRole="button"
              onPress={() => router.replace('/profile')}
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
            <View style={styles.headingText}>
              <Text accessibilityRole="header" style={styles.title}>
                Minhas lojas
              </Text>
              {activeStore ? (
                <Text numberOfLines={1} style={styles.currentStore}>
                  Loja ativa: {activeStore.name}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityLabel="Adicionar loja"
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/stores/create',
                  params: { from: 'stores' },
                })
              }
              style={styles.addButton}
            >
              <View pointerEvents="none">
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  size={19}
                  tintColor={colors.text.inverse}
                />
              </View>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.listArea,
            { width: contentWidth, marginTop: listTop - heroHeight },
          ]}
        >
          {notice ? (
            <View style={styles.noticeSlot}>
              <AppFeedback
                compact
                variant={notice.variant}
                title={notice.title}
                message={notice.message}
                onDismiss={() => setNotice(null)}
              />
            </View>
          ) : null}
          {!notice && (storeCreated === '1' || loggedIn === '1') ? (
            <View style={styles.noticeSlot}>
              <AppFeedback
                compact
                variant="success"
                title={
                  storeCreated === '1' ? 'Loja cadastrada' : 'Acesso realizado'
                }
                message="Suas lojas estão prontas para usar."
                onDismiss={() =>
                  router.setParams({ storeCreated: '', loggedIn: '' })
                }
              />
            </View>
          ) : null}
          {loading ? <LoadingState message="Carregando lojas..." /> : null}
          {!loading && loadError ? (
            <AppFeedback
              compact
              variant="error"
              title="Falha ao carregar lojas"
              message={loadError}
            />
          ) : null}
          {!loading && loadError ? (
            <AppButton
              title="Tentar novamente"
              variant="secondary"
              loading={busy}
              onPress={retryLoadingStores}
            />
          ) : null}
          {!loading && !loadError && stores.length === 0 ? (
            <EmptyState
              title="Você ainda não tem lojas"
              message="Cadastre seu primeiro brechó para organizar peças e preços por loja."
              actionLabel="Cadastrar loja"
              onAction={() =>
                router.push({
                  pathname: '/stores/create',
                  params: { from: 'stores' },
                })
              }
            />
          ) : null}
          {!loading &&
            !loadError &&
            stores.map((store) => (
              <View
                key={store.id}
                style={[styles.storeCard, store.isActive && styles.activeCard]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar ${store.name} como loja ativa`}
                  accessibilityState={{
                    selected: store.isActive,
                    disabled: busy,
                  }}
                  disabled={busy}
                  onPress={() => handleActivate(store)}
                  style={styles.storeMain}
                >
                  <View style={styles.logoWrap}>
                    {store.logoUrl ? (
                      <Image
                        source={{ uri: store.logoUrl }}
                        style={styles.logo}
                      />
                    ) : (
                      <View pointerEvents="none">
                        <SymbolView
                          name={{
                            ios: 'storefront',
                            android: 'storefront',
                            web: 'storefront',
                          }}
                          size={18}
                          tintColor={colors.action.secondary}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.storeInfo}>
                    <Text numberOfLines={1} style={styles.storeName}>
                      {store.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.storeMeta}>
                      {store.city} · {store.state} · {store.pieceCount}{' '}
                      {store.pieceCount === 1 ? 'peça' : 'peças'}
                    </Text>
                    {store.isActive ? (
                      <Text style={styles.activeLabel}>Loja ativa</Text>
                    ) : null}
                  </View>
                  {store.isActive ? (
                    <View pointerEvents="none">
                      <SymbolView
                        name={{
                          ios: 'checkmark',
                          android: 'check',
                          web: 'check',
                        }}
                        size={17}
                        tintColor={colors.action.secondary}
                      />
                    </View>
                  ) : null}
                </Pressable>
                <Pressable
                  accessibilityLabel={`Editar ${store.name}`}
                  accessibilityRole="button"
                  onPress={() => setEditTarget(store)}
                  style={styles.iconButton}
                >
                  <View pointerEvents="none">
                    <SymbolView
                      name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                      size={15}
                      tintColor={colors.text.secondary}
                    />
                  </View>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Excluir ${store.name}`}
                  accessibilityRole="button"
                  onPress={() => setDeleteTarget(store)}
                  style={styles.iconButton}
                >
                  <View pointerEvents="none">
                    <SymbolView
                      name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                      size={15}
                      tintColor={colors.semantic.error.foreground}
                    />
                  </View>
                </Pressable>
              </View>
            ))}
          {!loading && !loadError && stores.length > 0 ? (
            <Text style={styles.hint}>
              Toque em uma loja para torná-la ativa.
            </Text>
          ) : null}
          {!loading && !loadError && activeStore ? (
            <View style={styles.activeSummary}>
              <Text style={styles.summaryEyebrow}>
                NO CONTEXTO DO APLICATIVO
              </Text>
              <Text style={styles.summaryTitle}>{activeStore.name}</Text>
              <Text style={styles.summaryMeta}>
                {activeStore.city} · {activeStore.state} ·{' '}
                {activeStore.pieceCount}{' '}
                {activeStore.pieceCount === 1
                  ? 'peça cadastrada'
                  : 'peças cadastradas'}
              </Text>
              <Text style={styles.summaryLabel}>
                Amostra do estoque desta loja
              </Text>
              {activePieces.length > 0 ? (
                activePieces.map((piece) => (
                  <Text key={piece.id} style={styles.summaryPiece}>
                    • {piece.name}
                  </Text>
                ))
              ) : (
                <Text style={styles.summaryEmpty}>
                  Nenhuma peça cadastrada nesta loja.
                </Text>
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
      <AppBottomNav active="home" />
      <EditStoreModal
        store={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={handleEditedStore}
      />
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Excluir loja?"
        message={
          deleteTarget
            ? `A loja ${deleteTarget.name} será removida. Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir loja"
        destructive
        loading={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 24 },
  hero: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    width: '100%',
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
    fontSize: 21,
    lineHeight: 28,
    color: colors.text.primary,
  },
  headingText: { flex: 1, minWidth: 0 },
  currentStore: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    lineHeight: 13,
    color: colors.action.secondary,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action.primary,
  },
  listArea: { width: '90%', maxWidth: 420, gap: 10 },
  noticeSlot: { marginBottom: 8 },
  storeCard: {
    minHeight: 68,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surface.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  activeCard: { borderColor: colors.border.selected },
  storeMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 48,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface.selected,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 36, height: 36 },
  storeInfo: { flex: 1, minWidth: 0, gap: 1 },
  storeName: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.primary,
  },
  storeMeta: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
    lineHeight: 13,
    color: colors.text.secondary,
  },
  activeLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    lineHeight: 12,
    color: colors.action.secondary,
  },
  iconButton: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.selected,
  },
  hint: {
    marginTop: 5,
    textAlign: 'center',
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  activeSummary: {
    marginTop: 12,
    padding: 16,
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
    gap: 5,
  },
  summaryEyebrow: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.action.secondary,
  },
  summaryTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
  },
  summaryMeta: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  summaryLabel: {
    marginTop: 7,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.text.primary,
  },
  summaryPiece: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.text.secondary,
  },
  summaryEmpty: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.text.auxiliary,
  },
});
