import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
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
import { AppFeedback } from '@/components/app-feedback';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import type { Brand } from '@/features/brands/brand-types';
import {
  conditionLabels,
  isPieceCondition,
  isPieceStyle,
  styleLabels,
} from '@/features/inventory/piece-attributes';
import { useStores } from '@/features/stores/store-context';
import { mockBrandService } from '@/services/mock/mock-brand-service';
import { mockCategoryService } from '@/services/mock/mock-category-service';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';
import type { Category, PieceStatus, StorePiece } from '@/types/models';

const statusLabels: Record<PieceStatus, string> = {
  available: 'Livre',
  reserved: 'Reservada',
  clearance: 'Liquidação',
  sold: 'Vendida',
};
const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function missingFields(
  piece: StorePiece,
  categories: Category[],
  brands: Brand[],
) {
  const missing: string[] = [];
  if (!piece.name.trim()) missing.push('nome');
  if (!categories.some((item) => item.id === piece.categoryId))
    missing.push('categoria');
  if (!piece.brandId || !brands.some((item) => item.id === piece.brandId))
    missing.push('marca');
  if (!isPieceCondition(piece.condition)) missing.push('estado de conservação');
  if (!isPieceStyle(piece.style)) missing.push('estilo');
  if (!piece.status) missing.push('status');
  if (
    piece.acquisitionPrice === undefined ||
    !Number.isFinite(piece.acquisitionPrice) ||
    piece.acquisitionPrice < 0
  )
    missing.push('preço de aquisição');
  if (
    !piece.quantity ||
    !Number.isInteger(piece.quantity) ||
    piece.quantity < 1
  )
    missing.push('quantidade');
  if (
    !piece.acquisitionDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(piece.acquisitionDate)
  )
    missing.push('data da aquisição');
  return missing;
}

export default function PieceDetailScreen() {
  const { pieceId, saved, priced } = useLocalSearchParams<{
    pieceId?: string;
    saved?: string;
    priced?: string;
  }>();
  const { user } = useAuth();
  const { activeStore, activePieces, loading } = useStores();
  const { heroHeight, contentWidth } = useResponsiveLayout();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [optionsReady, setOptionsReady] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [notice, setNotice] = useState(
    saved === 'created' || saved === 'updated' || priced === '1',
  );
  const piece = activePieces.find((item) => item.id === pieceId);

  useEffect(() => {
    if (!user) return;
    let live = true;
    Promise.all([
      mockCategoryService.list(user.id),
      mockBrandService.list(user.id),
    ])
      .then(([nextCategories, nextBrands]) => {
        if (!live) return;
        setCategories(nextCategories);
        setBrands(nextBrands);
        setOptionsReady(true);
      })
      .catch((cause) => {
        if (live)
          setOptionsError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os detalhes.',
          );
      });
    return () => {
      live = false;
    };
  }, [user]);

  const missing =
    piece && optionsReady ? missingFields(piece, categories, brands) : [];
  const category = categories.find(
    (item) => item.id === piece?.categoryId,
  )?.name;
  const brand = brands.find((item) => item.id === piece?.brandId)?.name;
  const acquisitionDate = piece?.acquisitionDate
    ?.split('-')
    .reverse()
    .join('/');
  const margin =
    piece?.salePrice !== undefined &&
    piece?.acquisitionPrice !== undefined &&
    piece.salePrice > 0
      ? Math.round(
          ((piece.salePrice - piece.acquisitionPrice) / piece.salePrice) * 100,
        )
      : null;
  const profit =
    piece?.salePrice !== undefined && piece?.acquisitionPrice !== undefined
      ? piece.salePrice - piece.acquisitionPrice
      : null;

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={[s.hero, { height: heroHeight }]}>
          <View style={s.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar ao estoque"
              onPress={() => router.replace('/inventory')}
              style={s.roundButton}
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
            {piece ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar peça"
                onPress={() =>
                  router.push({
                    pathname: '/inventory/new',
                    params: { editId: piece.id },
                  })
                }
                style={s.roundButton}
              >
                <SymbolView
                  name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                  size={17}
                  tintColor={colors.action.secondary}
                />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View
          style={[s.body, { width: contentWidth, marginTop: 86 - heroHeight }]}
        >
          {loading || (piece && !optionsReady && !optionsError) ? (
            <LoadingState message="Carregando peça..." />
          ) : !piece || !activeStore ? (
            <EmptyState
              title="Peça não encontrada"
              message="Ela pode estar em outra loja. Selecione a loja correta no Estoque."
              actionLabel="Voltar ao estoque"
              onAction={() => router.replace('/inventory')}
            />
          ) : (
            <>
              {notice ? (
                <AppFeedback
                  compact
                  variant="success"
                  title={
                    priced === '1'
                      ? 'Preço salvo com sucesso.'
                      : saved === 'updated'
                        ? 'Peça atualizada com sucesso.'
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
              <View style={s.photo}>
                {piece.photoUri ? (
                  <Image
                    source={{ uri: piece.photoUri }}
                    style={s.photoImage}
                  />
                ) : (
                  <View style={s.photoPlaceholder}>
                    <SymbolView
                      name={{
                        ios: 'tshirt',
                        android: 'checkroom',
                        web: 'checkroom',
                      }}
                      size={74}
                      tintColor={colors.border.strong}
                    />
                    <Text style={s.photoHint}>Sem foto</Text>
                  </View>
                )}
              </View>
              <View style={s.identity}>
                <Text style={s.eyebrow}>
                  {(brand ?? 'Marca pendente').toUpperCase()} ·{' '}
                  {(category ?? 'Categoria pendente').toUpperCase()}
                </Text>
                <Text accessibilityRole="header" style={s.name}>
                  {piece.name || 'Nome pendente'}
                </Text>
                <Text style={s.meta}>
                  {piece.code ?? 'Sem código'} · Tam. {piece.size || '—'} ·{' '}
                  {isPieceCondition(piece.condition)
                    ? conditionLabels[piece.condition]
                    : 'Conservação pendente'}
                </Text>
                <Text style={s.store}>Loja: {activeStore.name}</Text>
              </View>
              <View style={s.status}>
                <Text style={s.statusLabel}>Status da peça</Text>
                <Text style={s.statusValue}>
                  {piece.status ? statusLabels[piece.status] : 'Pendente'}
                </Text>
              </View>
              <View style={s.metrics}>
                <View style={s.metric}>
                  <Text style={s.metricLabel}>Qtd.</Text>
                  <Text style={s.metricValue}>
                    {piece.quantity ? `${piece.quantity} un` : '—'}
                  </Text>
                </View>
                <View style={s.metric}>
                  <Text style={s.metricLabel}>Custo</Text>
                  <Text style={s.metricValue}>
                    {piece.acquisitionPrice !== undefined
                      ? currency(piece.acquisitionPrice)
                      : '—'}
                  </Text>
                </View>
                <View style={s.metric}>
                  <Text style={s.metricLabel}>Preço</Text>
                  <Text style={s.metricValue}>
                    {piece.salePrice !== undefined
                      ? currency(piece.salePrice)
                      : 'A definir'}
                  </Text>
                </View>
              </View>
              {margin !== null && profit !== null ? (
                <View style={s.margin}>
                  <Text style={s.statusLabel}>Margem atual</Text>
                  <Text style={s.marginValue}>
                    {margin}% · lucro {currency(profit)}
                  </Text>
                </View>
              ) : null}
              <View style={s.details}>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Estilo</Text>
                  <Text style={s.detailValue}>
                    {isPieceStyle(piece.style) ? styleLabels[piece.style] : '—'}
                  </Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Aquisição</Text>
                  <Text style={s.detailValue}>
                    {[piece.acquisitionPlace, acquisitionDate]
                      .filter(Boolean)
                      .join(' · ') || 'Pendente'}
                  </Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Coleção</Text>
                  <Text style={s.detailValue}>{piece.collection || '—'}</Text>
                </View>
                {piece.notes ? (
                  <View style={s.notes}>
                    <Text style={s.detailLabel}>Observações</Text>
                    <Text style={s.notesValue}>{piece.notes}</Text>
                  </View>
                ) : null}
              </View>
              {missing.length ? (
                <View style={s.missing}>
                  <Text style={s.missingTitle}>
                    Complete os dados obrigatórios
                  </Text>
                  <Text style={s.missingText}>{missing.join(' · ')}</Text>
                  <Text style={s.missingHint}>
                    Toque no lápis para corrigir antes de precificar.
                  </Text>
                </View>
              ) : null}
              <View style={s.actions}>
                <AppButton
                  title="Editar dados"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/inventory/new',
                      params: { editId: piece.id },
                    })
                  }
                  style={s.action}
                />
                <AppButton
                  title="Precificar"
                  disabled={missing.length > 0 || !optionsReady}
                  onPress={() =>
                    router.push({
                      pathname: '/inventory/price',
                      params: { pieceId: piece.id },
                    })
                  }
                  style={s.action}
                />
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
  content: { alignItems: 'center', paddingBottom: 28, flexGrow: 1 },
  hero: {
    width: '100%',
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  roundButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { maxWidth: 420, gap: 12 },
  photo: {
    height: 210,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: colors.surface.selected,
  },
  photoImage: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoHint: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.auxiliary,
  },
  identity: { gap: 2, paddingHorizontal: 3 },
  eyebrow: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    color: colors.action.secondary,
    letterSpacing: 0.5,
  },
  name: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    lineHeight: 29,
    color: colors.text.primary,
  },
  meta: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  store: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.action.secondary,
    marginTop: 2,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 11,
    backgroundColor: colors.surface.selected,
  },
  statusLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  statusValue: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.semantic.success.foreground,
  },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    minHeight: 67,
    borderRadius: 16,
    backgroundColor: colors.surface.primary,
    justifyContent: 'center',
    gap: 3,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  metricLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
    color: colors.text.auxiliary,
  },
  metricValue: {
    fontFamily: fontFamilies.display,
    fontSize: 14,
    color: colors.text.primary,
  },
  margin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.surface.selected,
    borderRadius: 16,
  },
  marginValue: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.semantic.success.foreground,
  },
  details: {
    borderRadius: 17,
    padding: 13,
    gap: 8,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  detailLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.auxiliary,
  },
  detailValue: {
    flex: 1,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    textAlign: 'right',
    color: colors.text.primary,
  },
  notes: {
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 8,
  },
  notesValue: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  missing: {
    borderWidth: 1,
    borderColor: colors.semantic.warning.foreground,
    borderRadius: 16,
    padding: 13,
    gap: 5,
    backgroundColor: colors.semantic.warning.background,
  },
  missingTitle: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    color: colors.semantic.warning.foreground,
  },
  missingText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.primary,
  },
  missingHint: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, minWidth: 0, minHeight: 42 },
});
