import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import { useAuth } from '@/features/auth/auth-context';
import type { Brand } from '@/features/brands/brand-types';
import {
  conditions,
  isPieceCondition,
  isPieceStyle,
  stylesList,
} from '@/features/inventory/piece-attributes';
import { calculatePricing } from '@/features/inventory/pricing';
import { useStores } from '@/features/stores/store-context';
import { mockBrandService } from '@/services/mock/mock-brand-service';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';
import type { PieceCondition, PieceStyle, StorePiece } from '@/types/models';

function parseMoney(value: string) {
  const raw = value.trim().replace(/\s|R\$/g, '');
  const normalized = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(raw)
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export default function PricePieceScreen() {
  const { pieceId } = useLocalSearchParams<{ pieceId?: string }>();
  const { user } = useAuth();
  const { activeStore, activePieces, createQuickPiece } = useStores();
  const { contentWidth } = useResponsiveLayout();
  const [mode, setMode] = useState<'stock' | 'quick'>('stock');
  const [selectedId, setSelectedId] = useState(pieceId ?? '');
  const [quickId, setQuickId] = useState('');
  const [name, setName] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState('');
  const [condition, setCondition] = useState<PieceCondition>('excellent');
  const [style, setStyle] = useState<PieceStyle>('social');
  const [acquisitionPrice, setAcquisitionPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialPiece = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    mockBrandService
      .list(user.id)
      .then((items) => {
        if (active) setBrands(items);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar as marcas.');
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (mode === 'quick') return;
    const targetId = pieceId ?? activePieces[0]?.id;
    if (!targetId || initialPiece.current === targetId) return;
    const piece = activePieces.find((item) => item.id === targetId);
    if (!piece) return;
    initialPiece.current = targetId;
    selectPiece(piece);
    // Inicializa a seleção quando as peças terminam de carregar.
  }, [pieceId, activePieces, mode]);

  function selectPiece(piece: StorePiece) {
    setMode('stock');
    setSelectedId(piece.id);
    setBrandId(piece.brandId ?? '');
    setCondition(
      isPieceCondition(piece.condition) ? piece.condition : 'excellent',
    );
    setStyle(isPieceStyle(piece.style) ? piece.style : 'social');
    setAcquisitionPrice(
      piece.acquisitionPrice === undefined
        ? ''
        : String(piece.acquisitionPrice).replace('.', ','),
    );
    setError(null);
  }

  function chooseMode(next: 'stock' | 'quick') {
    if (next === mode) return;
    if (next === 'stock') {
      const selected = activePieces.find((piece) => piece.id === selectedId);
      if (selected) selectPiece(selected);
      else setMode('stock');
      return;
    }
    setMode(next);
    setError(null);
    if (next === 'quick') {
      setBrandId('');
      setCondition('excellent');
      setStyle('social');
      setAcquisitionPrice('');
    }
  }

  async function suggest() {
    if (!activeStore)
      return setError('Selecione uma loja antes de precificar.');
    if (mode === 'stock' && !selectedId)
      return setError('Selecione uma peça do estoque.');
    if (mode === 'quick' && !name.trim())
      return setError('Informe o nome da peça.');
    const brand = brands.find((item) => item.id === brandId);
    if (!brand) return setError('Selecione uma marca.');
    const cost = parseMoney(acquisitionPrice);
    if (cost === null || cost < 0)
      return setError('Informe um valor de aquisição válido.');
    const pricing = calculatePricing(cost, brand.tier, condition, style);
    if (pricing.suggestedPrice <= 0)
      return setError('O preço sugerido deve ser maior que zero.');
    const input = {
      brandId,
      condition,
      style,
      acquisitionPrice: cost,
      salePrice: pricing.suggestedPrice,
    };
    setSaving(true);
    setError(null);
    try {
      let pricedPieceId = selectedId;
      if (mode === 'quick') {
        if (quickId) pricedPieceId = quickId;
        else {
          const piece = await createQuickPiece(name.trim(), input);
          setQuickId(piece.id);
          pricedPieceId = piece.id;
        }
      }
      router.push({
        pathname: '/inventory/suggestion',
        params: {
          pieceId: pricedPieceId,
          mode,
          brandId,
          brandName: brand.name,
          condition,
          style,
          acquisitionPrice: String(cost),
          suggestedPrice: String(pricing.suggestedPrice),
          score: String(pricing.score),
          percent: String(pricing.percent),
        },
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível precificar a peça.',
      );
    } finally {
      setSaving(false);
    }
  }

  function chips<T extends string>(
    items: readonly { value: T; label: string }[],
    selected: T,
    onSelect: (value: T) => void,
  ) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.chips}>
          {items.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === item.value }}
              onPress={() => {
                onSelect(item.value);
              }}
              style={[s.chip, selected === item.value && s.chipSelected]}
            >
              <Text
                style={[
                  s.chipText,
                  selected === item.value && s.chipTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.hero}>
            <View style={s.header}>
              <Text accessibilityRole="header" style={s.title}>
                Precificar
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar ao estoque"
                onPress={() => router.replace('/inventory')}
                style={s.history}
              >
                <SymbolView
                  name={{
                    ios: 'clock.arrow.circlepath',
                    android: 'history',
                    web: 'history',
                  }}
                  size={18}
                  tintColor={colors.text.primary}
                />
              </Pressable>
            </View>
            <View style={s.toggle}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: mode === 'stock' }}
                onPress={() => chooseMode('stock')}
                style={[s.toggleItem, mode === 'stock' && s.toggleSelected]}
              >
                <Text
                  style={[
                    s.toggleText,
                    mode === 'stock' && s.toggleTextSelected,
                  ]}
                >
                  Peça do estoque
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: mode === 'quick' }}
                onPress={() => chooseMode('quick')}
                style={[s.toggleItem, mode === 'quick' && s.toggleSelected]}
              >
                <Text
                  style={[
                    s.toggleText,
                    mode === 'quick' && s.toggleTextSelected,
                  ]}
                >
                  Peça avulsa
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={[s.card, { width: contentWidth }]}>
            {mode === 'stock' ? (
              <View style={s.fieldGroup}>
                <Text style={s.label}>Peça do estoque</Text>
                {activePieces.length ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={s.pieces}>
                      {activePieces.map((piece, index) => (
                        <Pressable
                          key={piece.id}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: selectedId === piece.id,
                          }}
                          onPress={() => selectPiece(piece)}
                          style={[
                            s.piece,
                            selectedId === piece.id && s.pieceSelected,
                          ]}
                        >
                          <View
                            style={[
                              s.pieceArt,
                              {
                                backgroundColor: [
                                  '#D6BAA7',
                                  '#C78265',
                                  '#E2B05E',
                                  '#D9CABE',
                                ][index % 4],
                              },
                            ]}
                          >
                            {piece.photoUri ? (
                              <Image
                                source={{ uri: piece.photoUri }}
                                style={s.pieceImage}
                              />
                            ) : (
                              <Text style={s.pieceIcon}>✦</Text>
                            )}
                          </View>
                          <Text numberOfLines={2} style={s.pieceName}>
                            {piece.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <Text style={s.helper}>
                    Nenhuma peça no estoque desta loja.
                  </Text>
                )}
              </View>
            ) : (
              <AppTextField
                label="Nome da peça"
                placeholder="Ex.: Jaqueta jeans"
                value={name}
                editable={!quickId}
                onChangeText={(value) => {
                  setName(value);
                }}
                maxLength={80}
              />
            )}
            <Text style={s.helper}>
              A sugestão considera apenas marca, estado de conservação e estilo.
            </Text>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Marca</Text>
              {chips(
                brands.map((brand) => ({ value: brand.id, label: brand.name })),
                brandId,
                setBrandId,
              )}
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Estado de conservação</Text>
              {chips(conditions, condition, setCondition)}
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Estilo</Text>
              {chips(stylesList, style, setStyle)}
            </View>
            <AppTextField
              label="Valor de aquisição (R$)"
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={acquisitionPrice}
              onChangeText={(value) => {
                setAcquisitionPrice(value);
              }}
            />
            <AppButton
              title="✦  Sugerir preço"
              onPress={suggest}
              loading={saving}
              disabled={!activeStore}
            />
            {error ? (
              <AppFeedback
                compact
                variant="error"
                title={error}
                onDismiss={() => setError(null)}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppBottomNav active="pricing" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  flex: { flex: 1 },
  content: { alignItems: 'center', paddingBottom: 24 },
  hero: {
    width: '100%',
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 26,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 23,
    color: colors.text.primary,
  },
  history: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: { flexDirection: 'row', gap: 12 },
  toggleItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 15,
  },
  toggleSelected: { backgroundColor: colors.surface.primary },
  toggleText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    color: colors.text.primary,
  },
  toggleTextSelected: { fontFamily: fontFamilies.sansSemiBold },
  card: {
    maxWidth: 440,
    marginTop: 14,
    padding: 16,
    gap: 18,
    backgroundColor: colors.surface.primary,
    borderRadius: 19,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.09,
    shadowRadius: 9,
    elevation: 3,
  },
  fieldGroup: { gap: 9 },
  label: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    color: colors.text.primary,
  },
  helper: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  pieces: { flexDirection: 'row', gap: 10 },
  piece: {
    width: 78,
    padding: 3,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
  },
  pieceSelected: { borderColor: colors.action.primary },
  pieceArt: {
    width: 70,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pieceImage: { width: '100%', height: '100%' },
  pieceIcon: { fontSize: 26, color: colors.text.auxiliary },
  pieceName: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.text.primary,
    marginTop: 5,
  },
  chips: { flexDirection: 'row', gap: 7, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
  },
  chipSelected: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  chipText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.primary,
  },
  chipTextSelected: {
    color: colors.text.inverse,
    fontFamily: fontFamilies.sansSemiBold,
  },
});
