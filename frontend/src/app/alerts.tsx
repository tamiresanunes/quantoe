import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFeedback } from '@/components/app-feedback';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import { inventoryAlerts } from '@/features/inventory/inventory-alerts';
import {
  defaultStockPreferences,
  type StockPreferences,
} from '@/features/stores/stock-preferences';
import { useStores } from '@/features/stores/store-context';
import { storeService } from '@/services';
import { mockCategoryService } from '@/services/mock/mock-category-service';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';
import type { Category } from '@/types/models';

export default function AlertsScreen() {
  const { user } = useAuth();
  const {
    activeStore,
    activePieces,
    loading: storeLoading,
    error: storeError,
  } = useStores();
  const { contentWidth } = useResponsiveLayout();
  const [categories, setCategories] = useState<Category[]>([]);
  const [preferences, setPreferences] = useState<StockPreferences>(
    defaultStockPreferences,
  );
  const [loadedKey, setLoadedKey] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const ownerId = user?.id;
  const storeId = activeStore?.id;
  const key = ownerId && storeId ? `${ownerId}:${storeId}` : '';

  useFocusEffect(
    useCallback(() => {
      if (!ownerId || !storeId) return;
      let active = true;
      setLoadedKey('');
      Promise.all([
        mockCategoryService.list(ownerId),
        storeService.getStockPreferences(ownerId, storeId),
      ])
        .then(([nextCategories, nextPreferences]) => {
          if (!active) return;
          setCategories(nextCategories);
          setPreferences(nextPreferences);
          setLoadError(null);
        })
        .catch((cause: unknown) => {
          if (active)
            setLoadError(
              cause instanceof Error
                ? cause.message
                : 'Não foi possível carregar os alertas.',
            );
        })
        .finally(() => {
          if (active) setLoadedKey(`${ownerId}:${storeId}`);
        });
      return () => {
        active = false;
      };
    }, [ownerId, storeId]),
  );

  const { idlePieces, lowCategories } = inventoryAlerts(
    activePieces,
    categories,
    preferences,
  );
  const loading = storeLoading || (!!key && loadedKey !== key);
  const total = idlePieces.length + lowCategories.length;

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={[s.inner, { width: contentWidth }]}>
          <View style={s.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={() => router.back()}
              style={s.back}
            >
              <SymbolView
                name={{
                  ios: 'chevron.left',
                  android: 'arrow_back',
                  web: 'arrow_back',
                }}
                size={18}
                tintColor={colors.text.primary}
              />
            </Pressable>
            <View style={s.heading}>
              <Text accessibilityRole="header" style={s.title}>
                Alertas
              </Text>
              <Text style={s.subtitle}>{activeStore?.name ?? 'Estoque'}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Configurar alertas"
              onPress={() => router.push('/profile/preferences')}
              style={s.settings}
            >
              <SymbolView
                name={{
                  ios: 'gearshape',
                  android: 'settings',
                  web: 'settings',
                }}
                size={18}
                tintColor={colors.action.primary}
              />
            </Pressable>
          </View>

          {loading ? (
            <LoadingState message="Carregando alertas..." />
          ) : storeError || loadError ? (
            <AppFeedback
              compact
              variant="error"
              title={storeError ?? loadError ?? ''}
            />
          ) : !activeStore ? (
            <EmptyState
              title="Nenhuma loja ativa"
              message="Selecione uma loja para acompanhar os alertas."
              actionLabel="Ver minhas lojas"
              onAction={() => router.push('/stores')}
            />
          ) : total === 0 ? (
            <EmptyState
              title="Nenhum alerta por agora"
              message="As peças paradas e as categorias abaixo do mínimo aparecerão aqui."
              actionLabel="Ver estoque"
              onAction={() => router.push('/inventory')}
            />
          ) : (
            <>
              <View style={s.summary}>
                <Text style={s.summaryNumber}>{total}</Text>
                <View>
                  <Text style={s.summaryTitle}>
                    {total === 1 ? 'alerta precisa' : 'alertas precisam'} de
                    atenção
                  </Text>
                  <Text style={s.summaryMeta}>
                    {idlePieces.length}{' '}
                    {idlePieces.length === 1 ? 'peça parada' : 'peças paradas'}{' '}
                    · {lowCategories.length}{' '}
                    {lowCategories.length === 1
                      ? 'categoria abaixo do mínimo'
                      : 'categorias abaixo do mínimo'}
                  </Text>
                </View>
              </View>

              <View style={s.section}>
                <Text style={s.sectionTitle}>Peças paradas</Text>
                <Text style={s.sectionSubtitle}>
                  Limite configurado: {preferences.idleDays} dias desde a
                  aquisição
                </Text>
                {idlePieces.length ? (
                  idlePieces.map(({ piece, days, limit }) => (
                    <Pressable
                      key={piece.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver ${piece.name}, ${days} dias em estoque`}
                      onPress={() =>
                        router.push({
                          pathname: '/inventory/detail',
                          params: { pieceId: piece.id },
                        })
                      }
                      style={s.card}
                    >
                      <View style={s.cardTop}>
                        <Text numberOfLines={1} style={s.cardTitle}>
                          {piece.name}
                        </Text>
                        <Text style={s.overdueBadge}>ACIMA DO LIMITE</Text>
                      </View>
                      <Text style={s.cardMeta}>
                        {days} dias em estoque · limite de {limit} dias
                      </Text>
                      <View style={s.suggestion}>
                        <SymbolView
                          name={{ ios: 'tag', android: 'sell', web: 'sell' }}
                          size={15}
                          tintColor={colors.action.primary}
                        />
                        <Text style={s.suggestionText}>
                          Sugestão: considerar liquidação
                        </Text>
                      </View>
                      <Text style={s.cardLink}>Ver peça ›</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={s.sectionEmpty}>
                    Nenhuma peça acima do limite.
                  </Text>
                )}
              </View>

              <View style={s.section}>
                <Text style={s.sectionTitle}>Baixo estoque por categoria</Text>
                <Text style={s.sectionSubtitle}>
                  Quantidade disponível abaixo do mínimo configurado
                </Text>
                {lowCategories.length ? (
                  lowCategories.map(({ category, quantity, minimum }) => (
                    <Pressable
                      key={category.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver peças de ${category.name}, ${quantity} de ${minimum} unidades`}
                      onPress={() =>
                        router.push({
                          pathname: '/inventory',
                          params: { filter: category.id },
                        })
                      }
                      style={s.card}
                    >
                      <View style={s.cardTop}>
                        <Text numberOfLines={1} style={s.cardTitle}>
                          {category.name}
                        </Text>
                        <Text style={s.lowBadge}>ESTOQUE BAIXO</Text>
                      </View>
                      <Text style={s.cardMeta}>
                        Atual: {quantity} un · mínimo: {minimum} un
                      </Text>
                      <View style={s.progressTrack}>
                        <View
                          style={[
                            s.progressFill,
                            {
                              width: `${Math.min(100, (quantity / minimum) * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={s.cardLink}>Ver peças da categoria ›</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={s.sectionEmpty}>
                    Todas as categorias estão acima do mínimo.
                  </Text>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { alignItems: 'center', paddingBottom: 32, flexGrow: 1 },
  inner: { maxWidth: 420, gap: 18, paddingTop: 13 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 5,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { flex: 1 },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 23,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  settings: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 17,
    borderRadius: 18,
    backgroundColor: colors.text.primary,
  },
  summaryNumber: {
    fontFamily: fontFamilies.display,
    fontSize: 33,
    color: colors.text.inverse,
  },
  summaryTitle: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    color: colors.text.inverse,
  },
  summaryMeta: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.border.default,
    maxWidth: 260,
  },
  section: { gap: 9 },
  sectionTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: -5,
  },
  card: {
    gap: 9,
    padding: 14,
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    flex: 1,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    color: colors.text.primary,
  },
  cardMeta: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  overdueBadge: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 8,
    color: colors.semantic.error.foreground,
    backgroundColor: colors.semantic.error.background,
    borderRadius: 7,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  lowBadge: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 8,
    color: colors.semantic.warning.foreground,
    backgroundColor: colors.semantic.warning.background,
    borderRadius: 7,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 9,
    borderRadius: 10,
    backgroundColor: colors.surface.selected,
  },
  suggestionText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.action.primary,
  },
  cardLink: {
    alignSelf: 'flex-end',
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10,
    color: colors.action.primary,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.semantic.warning.foreground,
  },
  sectionEmpty: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
    paddingVertical: 8,
  },
});
