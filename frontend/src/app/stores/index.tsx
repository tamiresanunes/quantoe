import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Image,
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
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import { storeService } from '@/services';
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';
import type { Store } from '@/types/models';

type Notice = {
  variant: 'success' | 'error';
  title: string;
  message?: string;
  id: number;
};

export default function StoresScreen() {
  const { storeCreated, storeUpdated, loggedIn } = useLocalSearchParams<{
    storeCreated?: string;
    storeUpdated?: string;
    loggedIn?: string;
  }>();
  const { height } = useWindowDimensions();
  const heroHeight = Math.round(height * 0.3);
  const listTop = height < 650 ? 88 : 96;
  const { user, signOut } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    storeService
      .listByOwner(user.id)
      .then((result) => {
        if (!mounted) return;
        setLoadFailed(false);
        if (result.length === 0) {
          router.replace('/stores/create');
          return;
        }
        setStores(result);
        if (storeCreated === '1' || storeUpdated === '1' || loggedIn === '1') {
          setNotice({
            variant: 'success',
            title:
              storeCreated === '1'
                ? 'Loja cadastrada'
                : storeUpdated === '1'
                  ? 'Loja atualizada'
                  : 'Acesso realizado',
            message: 'Suas lojas estão prontas para usar.',
            id: Date.now(),
          });
          router.setParams({
            storeCreated: '',
            storeUpdated: '',
            loggedIn: '',
          });
        }
      })
      .catch((cause) => {
        if (mounted) {
          setLoadFailed(true);
          showError(cause);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user, reloadKey, storeCreated, storeUpdated, loggedIn]);

  function showError(cause: unknown) {
    setNotice({
      variant: 'error',
      title: 'Não foi possível concluir a ação',
      message: cause instanceof Error ? cause.message : 'Tente novamente.',
      id: Date.now(),
    });
  }

  async function handleActivate(store: Store) {
    if (!user || store.isActive || busy) return;
    setBusy(true);
    try {
      await storeService.setActive(user.id, store.id);
      setStores((current) =>
        current.map((item) => ({ ...item, isActive: item.id === store.id })),
      );
      setNotice({
        variant: 'success',
        title: 'Loja ativa alterada',
        message: `${store.name} está ativa agora.`,
        id: Date.now(),
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
      await storeService.remove(user.id, deleteTarget.id);
      const remaining = await storeService.listByOwner(user.id);
      setDeleteTarget(null);
      if (remaining.length === 0) {
        router.replace('/stores/create');
        return;
      }
      setStores(remaining);
      setNotice({
        variant: 'success',
        title: 'Loja excluída',
        message: 'A loja foi removida da sua lista.',
        id: Date.now(),
      });
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
      setSignOutOpen(false);
      router.replace('/auth/login');
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { minHeight: heroHeight }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Sair da conta"
              accessibilityRole="button"
              onPress={() => setSignOutOpen(true)}
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
            <Text accessibilityRole="header" style={styles.title}>
              Minhas lojas
            </Text>
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

        <View style={[styles.listArea, { marginTop: listTop - heroHeight }]}>
          {notice ? (
            <View style={styles.noticeSlot}>
              <AppFeedback
                key={notice.id}
                compact
                variant={notice.variant}
                title={notice.title}
                message={notice.message}
                onDismiss={() => setNotice(null)}
              />
            </View>
          ) : null}
          {loading ? <LoadingState message="Carregando lojas..." /> : null}
          {!loading && loadFailed ? (
            <AppButton
              title="Tentar novamente"
              variant="secondary"
              onPress={() => {
                setLoading(true);
                setReloadKey((key) => key + 1);
              }}
            />
          ) : null}
          {!loading && !loadFailed && stores.length === 0 ? (
            <EmptyState
              title="Nenhuma loja encontrada"
              message="Cadastre uma loja para começar."
            />
          ) : null}
          {!loading &&
            !loadFailed &&
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
                  onPress={() =>
                    router.push({
                      pathname: '/stores/edit',
                      params: { id: store.id },
                    })
                  }
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
          {!loading && !loadFailed && stores.length > 0 ? (
            <Text style={styles.hint}>
              Toque em uma loja para torná-la ativa.
            </Text>
          ) : null}
        </View>
      </ScrollView>
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
      <ConfirmDialog
        visible={signOutOpen}
        title="Sair da conta?"
        message="Você precisará entrar novamente para acessar suas lojas."
        confirmLabel="Sair"
        destructive
        loading={busy}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={handleSignOut}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
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
    flex: 1,
    fontFamily: fontFamilies.display,
    fontSize: 21,
    lineHeight: 28,
    color: colors.text.primary,
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
});
