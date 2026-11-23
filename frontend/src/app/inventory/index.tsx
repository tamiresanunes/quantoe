import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FixedTopBand } from '@/components/fixed-top-band';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppFeedback } from '@/components/app-feedback';
import { useAuth } from '@/features/auth/auth-context';
import type { Brand } from '@/features/brands/brand-types';
import { InventoryPieceCard } from '@/features/inventory/inventory-piece-card';
import { conditions } from '@/features/inventory/piece-attributes';
import { stockAlertForPiece } from '@/features/inventory/stock-alerts';
import {
  InventoryEmptyState,
  InventoryLoadingState,
} from '@/features/inventory/inventory-states';
import { useStores } from '@/features/stores/store-context';
import {
  defaultStockPreferences,
  type StockPreferences,
} from '@/features/stores/stock-preferences';
import { storeService } from '@/services';
import { mockBrandService } from '@/services/mock/mock-brand-service';
import { mockCategoryService } from '@/services/mock/mock-category-service';
import { cardSurface } from '@/theme/card';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { layout } from '@/theme/spacing';
import { fontFamilies, fontSizes } from '@/theme/typography';
import type {
  Category,
  PieceCondition,
  PieceStatus,
  StorePiece,
} from '@/types/models';

const UNCATEGORIZED = '__uncategorized';
const UNBRANDED = '__unbranded';
const PENDING = '__pending';
const alertFilters = ['alerts', 'low', 'exhausted'];
const statuses: { value: PieceStatus; label: string }[] = [
  { value: 'available', label: 'Livre' },
  { value: 'reserved', label: 'Reservada' },
  { value: 'clearance', label: 'Liquidação' },
  { value: 'sold', label: 'Vendida' },
];

function parsePrice(value: string) {
  if (!value.trim()) return null;
  const input = value.trim();
  const decimal = /^\d+(?:[.,]\d{0,2})?$/.test(input);
  const grouped = /^\d{1,3}(?:\.\d{3})+(?:,\d{0,2})?$/.test(input);
  if (!decimal && !grouped) return NaN;
  const number = Number(
    (grouped ? input.replace(/\./g, '') : input).replace(',', '.'),
  );
  return Number.isFinite(number) && number >= 0 ? number : NaN;
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export default function InventoryScreen() {
  const params = useLocalSearchParams<{
    created?: string;
    priced?: string;
    query?: string;
    filter?: string;
  }>();
  return (
    <InventoryContent
      key={`${params.created}:${params.priced}:${params.query}:${params.filter}`}
      created={params.created}
      priced={params.priced}
      initialQuery={params.query}
      initialFilter={params.filter}
    />
  );
}

function InventoryContent({
  created,
  priced,
  initialQuery,
  initialFilter,
}: {
  created?: string;
  priced?: string;
  initialQuery?: string;
  initialFilter?: string;
}) {
  const { user } = useAuth();
  const { activeStore, activePieces, loading, error } = useStores();
  const { contentWidth, heroHeight } = useResponsiveLayout();
  const [notice, setNotice] = useState(created === '1' || priced === '1');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [preferences, setPreferences] = useState<StockPreferences>(
    defaultStockPreferences,
  );
  const [loadedStoreId, setLoadedStoreId] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery ?? '');
  const [alertFilter, setAlertFilter] = useState(
    initialFilter && alertFilters.includes(initialFilter)
      ? initialFilter
      : 'all',
  );
  const [categoryFilter, setCategoryFilter] = useState(
    initialFilter && !['all', ...alertFilters].includes(initialFilter)
      ? initialFilter
      : 'all',
  );
  const [brandFilter, setBrandFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState<
    'all' | PieceCondition
  >('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | PieceStatus | typeof PENDING
  >('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<'pieces' | 'categories'>('pieces');
  const [priceOrder, setPriceOrder] = useState<'none' | 'asc' | 'desc'>('none');

  const ownerId = user?.id;
  const storeId = activeStore?.id;
  const optionsLoading = !!storeId && loadedStoreId !== storeId;
  useEffect(() => {
    if (!ownerId || !storeId) return;
    let active = true;
    Promise.all([
      mockCategoryService.list(ownerId),
      mockBrandService.list(ownerId),
      storeService.getStockPreferences(ownerId, storeId),
    ])
      .then(([nextCategories, nextBrands, nextPreferences]) => {
        if (!active) return;
        setCategories(nextCategories);
        setBrands(nextBrands);
        setPreferences(nextPreferences);
        setOptionsError(null);
      })
      .catch((cause) => {
        if (active)
          setOptionsError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os cadastros.',
          );
      })
      .finally(() => {
        if (active) setLoadedStoreId(storeId);
      });
    return () => {
      active = false;
    };
  }, [ownerId, storeId]);

  const categoryIds = new Set(categories.map((category) => category.id));
  const categoryKey = (piece: StorePiece) =>
    categoryIds.has(piece.categoryId) ? piece.categoryId : UNCATEGORIZED;
  const categoryName = (key: string) =>
    categories.find((category) => category.id === key)?.name ?? 'Sem categoria';
  const brandName = (piece: StorePiece) =>
    brands.find((brand) => brand.id === piece.brandId)?.name ??
    'Marca pendente';
  const alertFor = (piece: StorePiece) =>
    stockAlertForPiece(piece, categories, preferences);
  const availableCategories = categories.filter((category) =>
    activePieces.some((piece) => piece.categoryId === category.id),
  );
  const availableBrands = brands.filter((brand) =>
    activePieces.some((piece) => piece.brandId === brand.id),
  );
  const hasUncategorized = activePieces.some(
    (piece) => categoryKey(piece) === UNCATEGORIZED,
  );
  const hasUnbranded = activePieces.some(
    (piece) =>
      !piece.brandId || !brands.some((brand) => brand.id === piece.brandId),
  );
  const search = normalize(query.trim());
  const minimum = parsePrice(minPrice);
  const maximum = parsePrice(maxPrice);
  const invalidPrice =
    Number.isNaN(minimum) ||
    Number.isNaN(maximum) ||
    (minimum !== null && maximum !== null && minimum > maximum);
  const activeFilterCount = [
    alertFilter !== 'all',
    categoryFilter !== 'all',
    brandFilter !== 'all',
    conditionFilter !== 'all',
    statusFilter !== 'all',
    minimum !== null || maximum !== null,
  ].filter(Boolean).length;
  const visible = activePieces
    .filter((piece) => {
      const matchesSearch =
        !search ||
        normalize(
          `${piece.name} ${piece.code ?? ''} ${brandName(piece)} ${categoryName(categoryKey(piece))}`,
        ).includes(search);
      const alert = alertFor(piece);
      const matchesAlert =
        alertFilter === 'all' ||
        (alertFilter === 'alerts' && alert !== null) ||
        alertFilter === alert;
      const matchesCategory =
        categoryFilter === 'all' || categoryKey(piece) === categoryFilter;
      const matchesBrand =
        brandFilter === 'all' ||
        (brandFilter === UNBRANDED
          ? !piece.brandId ||
            !brands.some((brand) => brand.id === piece.brandId)
          : piece.brandId === brandFilter);
      const matchesCondition =
        conditionFilter === 'all' || piece.condition === conditionFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === PENDING
          ? !piece.status
          : piece.status === statusFilter);
      const matchesPrice =
        !invalidPrice &&
        (minimum === null ||
          (piece.salePrice !== undefined && piece.salePrice >= minimum)) &&
        (maximum === null ||
          (piece.salePrice !== undefined && piece.salePrice <= maximum));
      return (
        matchesSearch &&
        matchesAlert &&
        matchesCategory &&
        matchesBrand &&
        matchesCondition &&
        matchesStatus &&
        matchesPrice
      );
    })
    .sort((a, b) => {
      if (priceOrder === 'none') return 0;
      const aPrice = a.salePrice;
      const bPrice = b.salePrice;
      if (aPrice === undefined) return 1;
      if (bPrice === undefined) return -1;
      return priceOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
    });
  const groupKeys = [
    ...availableCategories.map((category) => category.id),
    ...(hasUncategorized ? [UNCATEGORIZED] : []),
  ].filter((key) => visible.some((piece) => categoryKey(piece) === key));
  const cardWidth = (contentWidth - 10) / 2;
  const noMatchesTitle = invalidPrice
    ? 'Faixa de preço inválida'
    : 'Nenhuma peça encontrada';

  function clearFilters() {
    setQuery('');
    setAlertFilter('all');
    setCategoryFilter('all');
    setBrandFilter('all');
    setConditionFilter('all');
    setStatusFilter('all');
    setMinPrice('');
    setMaxPrice('');
  }

  function grid(pieces: StorePiece[]) {
    return (
      <View style={s.grid}>
        {pieces.map((piece) => (
          <InventoryPieceCard
            key={piece.id}
            piece={piece}
            brandName={brandName(piece)}
            width={cardWidth}
            index={activePieces.indexOf(piece)}
          />
        ))}
      </View>
    );
  }

  function chip(value: string, label: string) {
    const isAlert = value === 'all' || alertFilters.includes(value);
    const selected =
      value === 'all'
        ? activeFilterCount === 0 && !query.trim()
        : isAlert
          ? alertFilter === value
          : categoryFilter === value;
    return (
      <Pressable
        key={value}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => {
          if (value === 'all') {
            clearFilters();
          } else if (isAlert) {
            setAlertFilter(selected ? 'all' : value);
          } else {
            setCategoryFilter(selected ? 'all' : value);
          }
        }}
        style={[s.chip, selected && s.chipActive]}
      >
        <Text style={[s.chipText, selected && s.chipTextActive]}>{label}</Text>
      </Pressable>
    );
  }

  function optionChip(
    value: string,
    label: string,
    selected: boolean,
    onPress: () => void,
  ) {
    return (
      <Pressable
        key={value}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={[s.chip, selected && s.chipActive]}
      >
        <Text style={[s.chipText, selected && s.chipTextActive]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <FixedTopBand height={heroHeight} />
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.hero}>
          <View style={[s.heroInner, { width: contentWidth }]}>
            <View style={s.header}>
              <View>
                <Text accessibilityRole="header" style={s.title}>
                  Estoque
                </Text>
                <Text style={s.count}>
                  {loading || optionsLoading
                    ? 'CARREGANDO PEÇAS'
                    : `${activePieces.length} ${activePieces.length === 1 ? 'PEÇA' : 'PEÇAS'}`}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  priceOrder === 'none'
                    ? 'Ordenar por menor preço'
                    : priceOrder === 'asc'
                      ? 'Ordenar por maior preço'
                      : 'Remover ordem de preço'
                }
                onPress={() =>
                  setPriceOrder(
                    priceOrder === 'none'
                      ? 'asc'
                      : priceOrder === 'asc'
                        ? 'desc'
                        : 'none',
                  )
                }
                style={s.sort}
              >
                <SymbolView
                  name={{
                    ios: 'slider.horizontal.3',
                    android: 'tune',
                    web: 'tune',
                  }}
                  size={13}
                  tintColor={colors.text.primary}
                />
                <Text style={s.sortText}>
                  Preço
                  {priceOrder === 'asc'
                    ? ' ↑'
                    : priceOrder === 'desc'
                      ? ' ↓'
                      : ''}
                </Text>
              </Pressable>
            </View>
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
                style={s.searchInput}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={s.filters}>
                {chip('all', 'Todas')}
                {chip('alerts', 'Com alerta')}
                {chip('low', 'Estoque baixo')}
                {chip('exhausted', 'Esgotadas')}
                {availableCategories.map((category) =>
                  chip(category.id, category.name),
                )}
                {hasUncategorized ? chip(UNCATEGORIZED, 'Sem categoria') : null}
              </View>
            </ScrollView>
            <View style={s.filterToolbar}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: filtersOpen }}
                onPress={() => setFiltersOpen((open) => !open)}
                style={s.filterToggle}
              >
                <SymbolView
                  name={{
                    ios: 'line.3.horizontal.decrease',
                    android: 'tune',
                    web: 'tune',
                  }}
                  size={15}
                  tintColor={colors.action.primary}
                />
                <Text style={s.filterToggleText}>
                  Filtros{activeFilterCount ? ` (${activeFilterCount})` : ''}
                </Text>
              </Pressable>
              {query.trim() || activeFilterCount ? (
                <Pressable accessibilityRole="button" onPress={clearFilters}>
                  <Text style={s.clearText}>Limpar filtros</Text>
                </Pressable>
              ) : null}
            </View>
            {filtersOpen ? (
              <View style={s.filterPanel}>
                <View style={s.filterGroup}>
                  <Text style={s.filterLabel}>Categoria</Text>
                  <View style={s.filterChoices}>
                    {optionChip(
                      'category-all',
                      'Todas',
                      categoryFilter === 'all',
                      () => setCategoryFilter('all'),
                    )}
                    {availableCategories.map((category) =>
                      optionChip(
                        category.id,
                        category.name,
                        categoryFilter === category.id,
                        () => setCategoryFilter(category.id),
                      ),
                    )}
                    {hasUncategorized
                      ? optionChip(
                          UNCATEGORIZED,
                          'Sem categoria',
                          categoryFilter === UNCATEGORIZED,
                          () => setCategoryFilter(UNCATEGORIZED),
                        )
                      : null}
                  </View>
                </View>
                <View style={s.filterGroup}>
                  <Text style={s.filterLabel}>Marca</Text>
                  <View style={s.filterChoices}>
                    {optionChip(
                      'brand-all',
                      'Todas',
                      brandFilter === 'all',
                      () => setBrandFilter('all'),
                    )}
                    {availableBrands.map((brand) =>
                      optionChip(
                        brand.id,
                        brand.name,
                        brandFilter === brand.id,
                        () => setBrandFilter(brand.id),
                      ),
                    )}
                    {hasUnbranded
                      ? optionChip(
                          UNBRANDED,
                          'Sem marca',
                          brandFilter === UNBRANDED,
                          () => setBrandFilter(UNBRANDED),
                        )
                      : null}
                  </View>
                </View>
                <View style={s.filterGroup}>
                  <Text style={s.filterLabel}>Preço de venda (R$)</Text>
                  <View style={s.priceRow}>
                    <TextInput
                      accessibilityLabel="Preço mínimo"
                      keyboardType="decimal-pad"
                      placeholder="Mínimo"
                      placeholderTextColor={colors.text.auxiliary}
                      value={minPrice}
                      onChangeText={setMinPrice}
                      style={s.priceInput}
                    />
                    <Text style={s.priceSeparator}>até</Text>
                    <TextInput
                      accessibilityLabel="Preço máximo"
                      keyboardType="decimal-pad"
                      placeholder="Máximo"
                      placeholderTextColor={colors.text.auxiliary}
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                      style={s.priceInput}
                    />
                  </View>
                  {invalidPrice ? (
                    <Text style={s.priceError}>
                      Informe valores válidos, com o mínimo menor ou igual ao
                      máximo.
                    </Text>
                  ) : null}
                </View>
                <View style={s.filterGroup}>
                  <Text style={s.filterLabel}>Estado de conservação</Text>
                  <View style={s.filterChoices}>
                    {optionChip(
                      'condition-all',
                      'Todos',
                      conditionFilter === 'all',
                      () => setConditionFilter('all'),
                    )}
                    {conditions.map((condition) =>
                      optionChip(
                        condition.value,
                        condition.label,
                        conditionFilter === condition.value,
                        () => setConditionFilter(condition.value),
                      ),
                    )}
                  </View>
                </View>
                <View style={s.filterGroup}>
                  <Text style={s.filterLabel}>Status</Text>
                  <View style={s.filterChoices}>
                    {optionChip(
                      'status-all',
                      'Todos',
                      statusFilter === 'all',
                      () => setStatusFilter('all'),
                    )}
                    {statuses.map((status) =>
                      optionChip(
                        status.value,
                        status.label,
                        statusFilter === status.value,
                        () => setStatusFilter(status.value),
                      ),
                    )}
                    {optionChip(
                      PENDING,
                      'Pendente',
                      statusFilter === PENDING,
                      () => setStatusFilter(PENDING),
                    )}
                  </View>
                </View>
              </View>
            ) : null}
            <View style={s.viewSwitch}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: view === 'pieces' }}
                onPress={() => setView('pieces')}
                style={[s.viewButton, view === 'pieces' && s.viewButtonActive]}
              >
                <Text
                  style={[s.viewText, view === 'pieces' && s.viewTextActive]}
                >
                  Todas as peças
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: view === 'categories' }}
                onPress={() => setView('categories')}
                style={[
                  s.viewButton,
                  view === 'categories' && s.viewButtonActive,
                ]}
              >
                <Text
                  style={[
                    s.viewText,
                    view === 'categories' && s.viewTextActive,
                  ]}
                >
                  Por categoria
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[s.body, { width: contentWidth }]}>
          {!loading && !optionsLoading && activePieces.length > 0 ? (
            <Text style={s.resultCount}>
              {visible.length}{' '}
              {visible.length === 1 ? 'peça encontrada' : 'peças encontradas'}
            </Text>
          ) : null}
          {notice ? (
            <AppFeedback
              compact
              variant="success"
              title={
                priced === '1'
                  ? 'Peça precificada com sucesso.'
                  : 'Peça cadastrada com sucesso.'
              }
              onDismiss={() => setNotice(false)}
            />
          ) : null}
          {optionsError ? (
            <AppFeedback
              compact
              variant="error"
              title={optionsError}
              onDismiss={() => setOptionsError(null)}
            />
          ) : null}
          {loading || optionsLoading ? (
            <InventoryLoadingState cardWidth={cardWidth} />
          ) : error ? (
            <AppFeedback compact variant="error" title={error} />
          ) : !activeStore ? (
            <InventoryEmptyState
              title="Nenhuma loja ativa"
              message="Selecione uma loja para ver as peças do estoque."
              actionLabel="Ver minhas lojas"
              onAction={() => router.replace('/stores')}
            />
          ) : activePieces.length === 0 ? (
            <InventoryEmptyState
              title="Seu estoque está vazio"
              message="As peças cadastradas nesta loja aparecerão aqui."
              actionLabel="Cadastrar primeira peça"
              onAction={() => router.push('/inventory/new')}
            />
          ) : visible.length === 0 ? (
            <InventoryEmptyState
              icon="search"
              title={noMatchesTitle}
              message={
                invalidPrice
                  ? 'Ajuste os valores mínimo e máximo para pesquisar.'
                  : 'Tente outra busca ou ajuste os filtros selecionados.'
              }
              actionLabel="Limpar busca e filtros"
              onAction={clearFilters}
            />
          ) : view === 'pieces' ? (
            grid(visible)
          ) : (
            groupKeys.map((key) => {
              const pieces = visible.filter(
                (piece) => categoryKey(piece) === key,
              );
              return (
                <View key={key} style={s.group}>
                  <View style={s.groupHeader}>
                    <Text style={s.groupTitle}>{categoryName(key)}</Text>
                    <Text style={s.groupCount}>
                      {pieces.length} {pieces.length === 1 ? 'peça' : 'peças'}
                    </Text>
                  </View>
                  {grid(pieces)}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      {activeStore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cadastrar nova peça"
          onPress={() => router.push('/inventory/new')}
          style={s.add}
        >
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={25}
            tintColor={colors.text.inverse}
          />
        </Pressable>
      ) : null}
      <AppBottomNav active="inventory" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { alignItems: 'center', paddingBottom: 100, flexGrow: 1 },
  hero: {
    width: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    paddingTop: layout.screenTop,
    paddingBottom: 28,
  },
  heroInner: { maxWidth: 420, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.screenTitle,
    color: colors.text.primary,
  },
  count: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.action.secondary,
  },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: colors.surface.primary,
  },
  sortText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.text.primary,
  },
  searchBox: {
    height: 38,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 13,
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
  filters: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
  },
  chipActive: {
    borderColor: colors.text.primary,
    backgroundColor: colors.text.primary,
  },
  chipText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.primary,
  },
  chipTextActive: {
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.text.inverse,
  },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  filterToggleText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    color: colors.action.primary,
  },
  clearText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.action.primary,
  },
  filterPanel: {
    ...cardSurface,
    gap: 15,
    padding: 13,
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
  },
  filterGroup: { gap: 7 },
  filterLabel: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    color: colors.text.primary,
  },
  filterChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInput: {
    flex: 1,
    minWidth: 0,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingHorizontal: 10,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    color: colors.text.primary,
  },
  priceSeparator: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  priceError: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.semantic.error.foreground,
  },
  viewSwitch: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 3,
    borderRadius: 13,
    backgroundColor: colors.surface.selected,
  },
  viewButton: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10 },
  viewButtonActive: { backgroundColor: colors.surface.primary },
  viewText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  viewTextActive: {
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.text.primary,
  },
  body: { maxWidth: 420, marginTop: -12, gap: 12 },
  resultCount: {
    alignSelf: 'flex-end',
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.text.secondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  group: { gap: 9 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  groupTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 18,
    color: colors.text.primary,
  },
  groupCount: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  add: {
    position: 'absolute',
    right: 16,
    bottom: 70,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.15,
    shadowRadius: 7,
  },
});
