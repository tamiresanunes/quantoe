import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppFeedback } from '@/components/app-feedback';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import {
  minimumStockForPiece,
  stockAlertForPiece,
} from '@/features/inventory/stock-alerts';
import { inventoryAlerts } from '@/features/inventory/inventory-alerts';
import { calculateInventoryIndicators } from '@/features/inventory/inventory-indicators';
import {
  defaultStockPreferences,
  type StockPreferences,
} from '@/features/stores/stock-preferences';
import { useStores } from '@/features/stores/store-context';
import { storeService } from '@/services';
import { mockCategoryService } from '@/services/mock/mock-category-service';
import { cardSurface } from '@/theme/card';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { layout } from '@/theme/spacing';
import { fontFamilies, fontSizes } from '@/theme/typography';
import type { Category, StorePiece } from '@/types/models';

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { activeStore, activePieces, loading, error } = useStores();
  const { contentWidth } = useResponsiveLayout();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [preferences, setPreferences] = useState<StockPreferences>(
    defaultStockPreferences,
  );
  const [loadedStoreId, setLoadedStoreId] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const ownerId = user?.id;
  const storeId = activeStore?.id;

  useEffect(() => {
    if (!ownerId || !storeId) return;
    let live = true;
    Promise.all([
      mockCategoryService.list(ownerId),
      storeService.getStockPreferences(ownerId, storeId),
    ])
      .then(([nextCategories, nextPreferences]) => {
        if (!live) return;
        setCategories(nextCategories);
        setPreferences(nextPreferences);
        setAlertsError(null);
      })
      .catch((cause) => {
        if (live) {
          setCategories([]);
          setPreferences(defaultStockPreferences());
          setAlertsError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os alertas.',
          );
        }
      })
      .finally(() => {
        if (live) setLoadedStoreId(storeId);
      });
    return () => {
      live = false;
    };
  }, [ownerId, storeId]);

  const firstName = user?.name.trim().split(/\s+/)[0] || 'você';
  const inventoryIndicators = calculateInventoryIndicators(
    activePieces,
    categories,
  );
  const inventoryValue = inventoryIndicators.potentialSale;
  const alerts = activePieces
    .map((piece) => ({
      piece,
      kind: stockAlertForPiece(piece, categories, preferences),
    }))
    .filter(
      (item): item is { piece: StorePiece; kind: 'exhausted' | 'low' } =>
        item.kind !== null,
    )
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'exhausted' ? -1 : 1));
  const exhaustedCount = alerts.filter(
    (item) => item.kind === 'exhausted',
  ).length;
  const lowCount = alerts.filter((item) => item.kind === 'low').length;
  const alertSummary = inventoryAlerts(activePieces, categories, preferences);
  const alertCount =
    alerts.length +
    alertSummary.idlePieces.length +
    alertSummary.lowCategories.length;
  const isLoading =
    loading || (!!activeStore && loadedStoreId !== activeStore.id);

  function searchInventory() {
    router.push({ pathname: '/inventory', params: { query: query.trim() } });
  }

  function openInventory(filter?: 'alerts' | 'low' | 'exhausted') {
    router.push(
      filter ? { pathname: '/inventory', params: { filter } } : '/inventory',
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.body, { width: contentWidth }]}>
          <View style={s.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Selecionar loja"
              onPress={() => router.push('/stores')}
              style={s.storeButton}
            >
              <Text numberOfLines={1} style={s.storeName}>
                {activeStore?.name ?? 'Minhas lojas'}
              </Text>
              <SymbolView
                name={{
                  ios: 'chevron.down',
                  android: 'keyboard_arrow_down',
                  web: 'keyboard_arrow_down',
                }}
                size={12}
                tintColor={colors.text.primary}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir notificações"
              onPress={() => router.navigate('/alerts')}
              style={s.bell}
            >
              <SymbolView
                name={{
                  ios: 'bell',
                  android: 'notifications',
                  web: 'notifications',
                }}
                size={layout.headerIcon}
                tintColor={colors.text.primary}
              />
              {alertCount ? <View style={s.notificationDot} /> : null}
            </Pressable>
          </View>

          <Text accessibilityRole="header" style={s.greeting}>
            {greeting()}, <Text style={s.firstName}>{firstName}</Text>
          </Text>

          <View style={s.searchBox}>
            <SymbolView
              name={{
                ios: 'magnifyingglass',
                android: 'search',
                web: 'search',
              }}
              size={16}
              tintColor={colors.text.auxiliary}
            />
            <TextInput
              accessibilityLabel="Buscar peça, marca ou código"
              placeholder="Buscar peça, marca ou código"
              placeholderTextColor={colors.text.auxiliary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchInventory}
              returnKeyType="search"
              style={s.searchInput}
            />
          </View>

          {isLoading ? (
            <LoadingState message="Carregando início..." />
          ) : error ? (
            <AppFeedback compact variant="error" title={error} />
          ) : !activeStore ? (
            <EmptyState
              title="Comece com uma loja"
              message="Cadastre um brechó para acompanhar peças, valores e alertas."
              actionLabel="Ver minhas lojas"
              onAction={() => router.push('/stores')}
            />
          ) : (
            <>
              {alertsError ? (
                <AppFeedback
                  compact
                  variant="error"
                  title={alertsError}
                  onDismiss={() => setAlertsError(null)}
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver estoque"
                onPress={() => openInventory()}
                style={s.valueCard}
              >
                <Text style={s.valueLabel}>VALOR EM ESTOQUE</Text>
                <Text style={s.value}>{currency(inventoryValue)}</Text>
                <Text style={s.valueMeta}>
                  {inventoryIndicators.totalPieces}{' '}
                  {inventoryIndicators.totalPieces === 1 ? 'peça' : 'peças'}　
                  Vendas na semana: —
                </Text>
              </Pressable>

              <View style={s.stats}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${lowCount} peças com estoque baixo`}
                  onPress={() => openInventory('low')}
                  style={s.statCard}
                >
                  <SymbolView
                    name={{
                      ios: 'exclamationmark.triangle',
                      android: 'warning',
                      web: 'warning',
                    }}
                    size={18}
                    tintColor={colors.semantic.warning.foreground}
                  />
                  <Text style={s.statNumber}>{lowCount}</Text>
                  <Text style={s.statLabel}>Estoque baixo</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${exhaustedCount} peças esgotadas`}
                  onPress={() => openInventory('exhausted')}
                  style={s.statCard}
                >
                  <SymbolView
                    name={{
                      ios: 'shippingbox',
                      android: 'inventory_2',
                      web: 'inventory_2',
                    }}
                    size={18}
                    tintColor={colors.semantic.error.foreground}
                  />
                  <Text style={s.statNumber}>{exhaustedCount}</Text>
                  <Text style={s.statLabel}>Esgotadas</Text>
                </Pressable>
              </View>

              <Text style={s.sectionTitle}>Ações rápidas</Text>
              <View style={s.quickActions}>
                <QuickAction
                  label="Nova peça"
                  icon={{ ios: 'plus', android: 'add', web: 'add' }}
                  onPress={() => router.push('/inventory/new')}
                />
                <QuickAction
                  label="Precificar"
                  icon={{ ios: 'plus', android: 'calculate', web: 'calculate' }}
                  onPress={() => router.push('/inventory/price')}
                />
                <QuickAction
                  label="Movimentar"
                  icon={{
                    ios: 'arrow.left.arrow.right',
                    android: 'swap_horiz',
                    web: 'swap_horiz',
                  }}
                  onPress={() => router.push('/inventory/move')}
                />
                <QuickAction
                  label="Relatórios"
                  icon={{
                    ios: 'arrow.up.right',
                    android: 'north_east',
                    web: 'north_east',
                  }}
                  onPress={() => router.push('/reports')}
                />
              </View>

              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Peças com alerta</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver todas as peças com alerta"
                  onPress={() => openInventory('alerts')}
                >
                  <Text style={s.seeAll}>Ver todas</Text>
                </Pressable>
              </View>
              {alerts.length ? (
                alerts.slice(0, 3).map(({ piece, kind }, index) => (
                  <Pressable
                    key={piece.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ${piece.name}`}
                    onPress={() =>
                      router.push({
                        pathname: '/inventory/detail',
                        params: { pieceId: piece.id },
                      })
                    }
                    style={s.alertCard}
                  >
                    <View
                      style={[
                        s.alertPhoto,
                        {
                          backgroundColor: [
                            colors.brand.clay,
                            colors.border.default,
                            colors.brand.terracotta,
                          ][index % 3],
                        },
                      ]}
                    >
                      {piece.photoUri ? (
                        <Image
                          source={{ uri: piece.photoUri }}
                          style={s.alertImage}
                        />
                      ) : (
                        <SymbolView
                          name={{
                            ios: 'tshirt.fill',
                            android: 'checkroom',
                            web: 'checkroom',
                          }}
                          size={24}
                          tintColor={colors.border.strong}
                        />
                      )}
                    </View>
                    <View style={s.alertCopy}>
                      <Text numberOfLines={1} style={s.alertName}>
                        {piece.name}
                      </Text>
                      <Text style={s.alertMeta}>
                        {piece.quantity ?? '—'} un · mín.{' '}
                        {minimumStockForPiece(piece, categories, preferences)}
                      </Text>
                    </View>
                    <Text
                      style={[s.alertBadge, kind === 'low' && s.alertBadgeLow]}
                    >
                      {kind === 'exhausted' ? 'ESGOTADO' : 'ESTOQUE BAIXO'}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={s.noAlerts}>
                  Nenhuma peça precisa de atenção agora.
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <AppBottomNav active="home" />
    </SafeAreaView>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: ComponentProps<typeof SymbolView>['name'];
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.quickAction, disabled && s.quickActionDisabled]}
    >
      <View style={s.quickIcon}>
        <SymbolView name={icon} size={19} tintColor={colors.action.primary} />
      </View>
      <Text style={s.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { alignItems: 'center', paddingBottom: 30, flexGrow: 1 },
  body: {
    maxWidth: 420,
    gap: layout.screenContentGap,
    paddingTop: layout.screenTop,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '75%',
  },
  storeName: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    color: colors.text.primary,
  },
  bell: {
    width: layout.headerButton,
    height: layout.headerButton,
    borderRadius: layout.headerButton / 2,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.action.primary,
  },
  greeting: {
    fontFamily: fontFamilies.display,
    fontSize: 25,
    color: colors.text.primary,
    marginTop: 2,
  },
  firstName: { color: colors.action.primary, fontStyle: 'italic' },
  searchBox: {
    height: 38,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 14,
    backgroundColor: colors.surface.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.primary,
  },
  valueCard: {
    ...cardSurface,
    borderColor: colors.border.strong,
    minHeight: 90,
    borderRadius: 17,
    backgroundColor: colors.text.primary,
    padding: 14,
    justifyContent: 'center',
    gap: 2,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 3,
  },
  valueLabel: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9,
    color: colors.border.default,
  },
  value: {
    fontFamily: fontFamilies.display,
    fontSize: 29,
    color: colors.text.inverse,
  },
  valueMeta: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.border.default,
  },
  stats: { flexDirection: 'row', gap: 10 },
  statCard: {
    ...cardSurface,
    flex: 1,
    minHeight: 88,
    borderRadius: 17,
    padding: 12,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.09,
    shadowRadius: 7,
    elevation: 2,
  },
  statNumber: {
    fontFamily: fontFamilies.display,
    fontSize: 25,
    color: colors.text.primary,
    lineHeight: 28,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.sectionTitle,
    color: colors.text.primary,
    marginTop: 8,
  },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { flex: 1, alignItems: 'center', gap: 5 },
  quickActionDisabled: { opacity: 0.55 },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    color: colors.text.primary,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  seeAll: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.action.primary,
  },
  alertCard: {
    ...cardSurface,
    minHeight: 54,
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  alertPhoto: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  alertImage: { width: '100%', height: '100%' },
  alertCopy: { flex: 1 },
  alertName: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10,
    color: colors.text.primary,
  },
  alertMeta: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
    color: colors.text.secondary,
  },
  alertBadge: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 8,
    color: colors.semantic.error.foreground,
    backgroundColor: colors.semantic.error.background,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  alertBadgeLow: {
    color: colors.semantic.warning.foreground,
    backgroundColor: colors.semantic.warning.background,
  },
  noAlerts: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 22,
  },
});
