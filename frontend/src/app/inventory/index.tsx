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

import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppFeedback } from '@/components/app-feedback';
import { useAuth } from '@/features/auth/auth-context';
import type { Brand } from '@/features/brands/brand-types';
import { InventoryPieceCard } from '@/features/inventory/inventory-piece-card';
import {
  InventoryEmptyState,
  InventoryLoadingState,
} from '@/features/inventory/inventory-states';
import { useStores } from '@/features/stores/store-context';
import { mockBrandService } from '@/services/mock/mock-brand-service';
import { mockCategoryService } from '@/services/mock/mock-category-service';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';
import type { Category, StorePiece } from '@/types/models';

const UNCATEGORIZED = '__uncategorized';

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export default function InventoryScreen() {
  const { created, priced } = useLocalSearchParams<{
    created?: string;
    priced?: string;
  }>();
  const { user } = useAuth();
  const { activeStore, activePieces, loading, error } = useStores();
  const { contentWidth } = useResponsiveLayout();
  const [notice, setNotice] = useState(created === '1' || priced === '1');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'pieces' | 'categories'>('pieces');
  const [priceOrder, setPriceOrder] = useState<'none' | 'asc' | 'desc'>('none');

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      mockCategoryService.list(user.id),
      mockBrandService.list(user.id),
    ])
      .then(([nextCategories, nextBrands]) => {
        if (!active) return;
        setCategories(nextCategories);
        setBrands(nextBrands);
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
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const categoryIds = new Set(categories.map((category) => category.id));
  const categoryKey = (piece: StorePiece) =>
    categoryIds.has(piece.categoryId) ? piece.categoryId : UNCATEGORIZED;
  const categoryName = (key: string) =>
    categories.find((category) => category.id === key)?.name ?? 'Sem categoria';
  const brandName = (piece: StorePiece) =>
    brands.find((brand) => brand.id === piece.brandId)?.name ??
    'Marca pendente';
  const exhausted = (piece: StorePiece) =>
    piece.quantity === 0 || piece.status === 'sold';
  const lowStock = (piece: StorePiece) => {
    const minimum =
      categories.find((category) => category.id === piece.categoryId)
        ?.minimumStock ?? 2;
    return (
      !exhausted(piece) &&
      piece.quantity !== undefined &&
      piece.quantity <= minimum
    );
  };
  const availableCategories = categories.filter((category) =>
    activePieces.some((piece) => piece.categoryId === category.id),
  );
  const hasUncategorized = activePieces.some(
    (piece) => categoryKey(piece) === UNCATEGORIZED,
  );
  const search = normalize(query.trim());
  const visible = activePieces
    .filter((piece) => {
      const matchesSearch =
        !search ||
        normalize(
          `${piece.name} ${piece.code ?? ''} ${brandName(piece)} ${categoryName(categoryKey(piece))}`,
        ).includes(search);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'low' && lowStock(piece)) ||
        (filter === 'exhausted' && exhausted(piece)) ||
        categoryKey(piece) === filter;
      return matchesSearch && matchesFilter;
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
  const noMatchesTitle = query.trim()
    ? 'Nenhuma peça encontrada'
    : filter === 'low'
      ? 'Nenhuma peça com estoque baixo'
      : filter === 'exhausted'
        ? 'Nenhuma peça esgotada'
        : 'Nenhuma peça nesta categoria';

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
    return (
      <Pressable
        key={value}
        accessibilityRole="button"
        accessibilityState={{ selected: filter === value }}
        onPress={() => setFilter(value)}
        style={[s.chip, filter === value && s.chipActive]}
      >
        <Text style={[s.chipText, filter === value && s.chipTextActive]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
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
                {chip('low', 'Estoque baixo')}
                {chip('exhausted', 'Esgotadas')}
                {availableCategories.map((category) =>
                  chip(category.id, category.name),
                )}
                {hasUncategorized ? chip(UNCATEGORIZED, 'Sem categoria') : null}
              </View>
            </ScrollView>
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
              message="Tente outra busca ou volte a mostrar todas as peças."
              actionLabel="Limpar busca e filtros"
              onAction={() => {
                setQuery('');
                setFilter('all');
              }}
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
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    paddingTop: 12,
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
    fontSize: 23,
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
  viewSwitch: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 3,
    borderRadius: 13,
    backgroundColor: '#ECD7D1',
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
