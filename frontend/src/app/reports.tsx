import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppFeedback } from '@/components/app-feedback';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import { calculateInventoryIndicators } from '@/features/inventory/inventory-indicators';
import { useStores } from '@/features/stores/store-context';
import { mockCategoryService } from '@/services/mock/mock-category-service';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';
import type { Category } from '@/types/models';

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const categoryColors = [
  colors.brand.terracotta,
  colors.brand.olive,
  colors.brand.clay,
  colors.text.secondary,
  colors.border.strong,
] as const;

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <View style={s.metricCard}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={s.metricValue}
      >
        {value}
      </Text>
      {detail ? <Text style={s.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

export default function ReportsScreen() {
  const { user } = useAuth();
  const {
    activeStore,
    activePieces,
    loading: storeLoading,
    error: storeError,
  } = useStores();
  const { contentWidth } = useResponsiveLayout();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadedOwnerId, setLoadedOwnerId] = useState('');
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const ownerId = user?.id;

  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    mockCategoryService
      .list(ownerId)
      .then((items) => {
        if (!active) return;
        setCategories(items);
        setCategoriesError(null);
      })
      .catch((cause: unknown) => {
        if (active)
          setCategoriesError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar as categorias.',
          );
      })
      .finally(() => {
        if (active) setLoadedOwnerId(ownerId);
      });
    return () => {
      active = false;
    };
  }, [ownerId]);

  const indicators = calculateInventoryIndicators(activePieces, categories);
  const maxCategoryQuantity = indicators.byCategory[0]?.quantity ?? 1;
  const loading = storeLoading || (!!ownerId && loadedOwnerId !== ownerId);

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.hero}>
          <View style={[s.inner, { width: contentWidth }]}>
            <View style={s.header}>
              <View>
                <Text accessibilityRole="header" style={s.title}>
                  Relatórios
                </Text>
                <Text style={s.subtitle}>
                  Indicadores do estoque disponível
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Trocar loja ativa"
                onPress={() => router.push('/stores')}
                style={s.storeButton}
              >
                <Text numberOfLines={1} style={s.storeName}>
                  {activeStore?.name ?? 'Selecionar loja'}
                </Text>
                <SymbolView
                  name={{
                    ios: 'chevron.down',
                    android: 'keyboard_arrow_down',
                    web: 'keyboard_arrow_down',
                  }}
                  size={12}
                  tintColor={colors.action.primary}
                />
              </Pressable>
            </View>

            {loading ? (
              <LoadingState message="Carregando indicadores..." />
            ) : storeError || categoriesError ? (
              <AppFeedback
                compact
                variant="error"
                title={storeError ?? categoriesError ?? ''}
              />
            ) : !activeStore ? (
              <EmptyState
                title="Nenhuma loja ativa"
                message="Selecione uma loja para ver seus indicadores."
                actionLabel="Ver minhas lojas"
                onAction={() => router.push('/stores')}
              />
            ) : indicators.totalPieces === 0 ? (
              <EmptyState
                title="Sem peças disponíveis"
                message="Cadastre peças com quantidade em estoque para acompanhar os indicadores."
                actionLabel="Ver estoque"
                onAction={() => router.push('/inventory')}
              />
            ) : (
              <View style={s.metrics}>
                <MetricCard
                  label="Peças ativas"
                  value={String(indicators.totalPieces)}
                  detail={`${indicators.listingCount} ${indicators.listingCount === 1 ? 'cadastro' : 'cadastros'}`}
                />
                <MetricCard
                  label="Valor investido"
                  value={currency(indicators.invested)}
                />
                <MetricCard
                  label="Venda potencial"
                  value={currency(indicators.potentialSale)}
                />
                <MetricCard
                  label="Lucro potencial"
                  value={currency(indicators.potentialProfit)}
                />
              </View>
            )}
          </View>
        </View>

        {!loading &&
        !storeError &&
        !categoriesError &&
        activeStore &&
        indicators.totalPieces > 0 ? (
          <View style={[s.body, { width: contentWidth }]}>
            <Text style={s.note}>
              Valores simulados com as peças disponíveis. O lucro considera{' '}
              {indicators.pricedPieces}{' '}
              {indicators.pricedPieces === 1
                ? 'peça com custo e preço informados'
                : 'peças com custo e preço informados'}
              .
            </Text>
            <View style={s.sectionHeading}>
              <Text style={s.sectionTitle}>Por categoria</Text>
              <Text style={s.sectionCount}>
                {indicators.byCategory.length}{' '}
                {indicators.byCategory.length === 1
                  ? 'categoria'
                  : 'categorias'}
              </Text>
            </View>
            <View style={s.categoryCard}>
              {indicators.byCategory.map((category, index) => (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver ${category.name}: ${category.quantity} peças`}
                  onPress={() =>
                    router.push({
                      pathname: '/inventory',
                      params: { filter: category.id },
                    })
                  }
                  style={[s.categoryRow, index > 0 && s.categoryDivider]}
                >
                  <View style={s.categoryTop}>
                    <View style={s.categoryNameGroup}>
                      <View
                        style={[
                          s.categoryDot,
                          {
                            backgroundColor:
                              categoryColors[index % categoryColors.length],
                          },
                        ]}
                      />
                      <Text numberOfLines={1} style={s.categoryName}>
                        {category.name}
                      </Text>
                    </View>
                    <Text style={s.categoryQuantity}>
                      {category.quantity}{' '}
                      {category.quantity === 1 ? 'peça' : 'peças'}
                    </Text>
                  </View>
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.barFill,
                        {
                          width: `${(category.quantity / maxCategoryQuantity) * 100}%`,
                          backgroundColor:
                            categoryColors[index % categoryColors.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={s.categoryValue}>
                    Venda potencial: {currency(category.potentialSale)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
      <AppBottomNav active="reports" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { alignItems: 'center', paddingBottom: 95, flexGrow: 1 },
  hero: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 13,
    paddingBottom: 27,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  inner: { maxWidth: 420, gap: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },
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
  storeButton: {
    maxWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: colors.surface.primary,
  },
  storeName: {
    flexShrink: 1,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.action.primary,
  },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '48%',
    minHeight: 88,
    padding: 12,
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
    justifyContent: 'center',
    gap: 3,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  metricLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  metricValue: {
    fontFamily: fontFamilies.display,
    fontSize: 21,
    color: colors.text.primary,
  },
  metricDetail: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
    color: colors.text.auxiliary,
  },
  body: { maxWidth: 420, gap: 12, marginTop: 15 },
  note: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.text.secondary,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 19,
    color: colors.text.primary,
  },
  sectionCount: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  categoryCard: {
    borderRadius: 18,
    paddingHorizontal: 13,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  categoryRow: { gap: 7, paddingVertical: 12 },
  categoryDivider: { borderTopWidth: 1, borderTopColor: colors.border.default },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryNameGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  categoryDot: { width: 9, height: 9, borderRadius: 5 },
  categoryName: {
    flexShrink: 1,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  categoryQuantity: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    color: colors.text.primary,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  categoryValue: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
});
