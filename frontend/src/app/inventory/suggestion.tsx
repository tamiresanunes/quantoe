import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
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
import {
  conditionLabels,
  isPieceCondition,
  isPieceStyle,
  styleLabels,
} from '@/features/inventory/piece-attributes';
import { useStores } from '@/features/stores/store-context';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

type Params = {
  pieceId?: string;
  mode?: string;
  brandId?: string;
  brandName?: string;
  condition?: string;
  style?: string;
  acquisitionPrice?: string;
  suggestedPrice?: string;
  score?: string;
  percent?: string;
};

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function parseMoney(value: string) {
  const raw = value.trim().replace(/\s|R\$/g, '');
  const normalized = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(raw)
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export default function SuggestedPriceScreen() {
  const params = useLocalSearchParams<Params>();
  const { activePieces, pricePiece } = useStores();
  const { contentWidth } = useResponsiveLayout();
  const suggested = Number(params.suggestedPrice);
  const cost = Number(params.acquisitionPrice);
  const score = Number(params.score);
  const appliedPercent = Number(params.percent);
  const [finalPrice, setFinalPrice] = useState(
    Number.isFinite(suggested) && suggested > 0
      ? suggested.toFixed(2).replace('.', ',')
      : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount = parseMoney(finalPrice);
  const piece = activePieces.find((item) => item.id === params.pieceId);
  const valid =
    !!piece &&
    !!params.brandId &&
    isPieceCondition(params.condition) &&
    isPieceStyle(params.style) &&
    Number.isFinite(cost) &&
    cost > 0 &&
    Number.isFinite(suggested) &&
    suggested > 0 &&
    Number.isInteger(score) &&
    score >= 0 &&
    [40, 70, 100, 140, 180].includes(appliedPercent);
  const conditionLabel = isPieceCondition(params.condition)
    ? conditionLabels[params.condition]
    : '—';
  const styleLabel = isPieceStyle(params.style)
    ? styleLabels[params.style]
    : '—';
  const suggestedPercent = valid ? appliedPercent : 0;
  const finalPercent =
    valid && amount !== null ? Math.round((amount / cost - 1) * 100) : null;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/inventory/price');
  }

  function adjust(delta: number) {
    const current = parseMoney(finalPrice) ?? suggested;
    setFinalPrice(
      Math.max(0.01, current + delta)
        .toFixed(2)
        .replace('.', ','),
    );
    setError(null);
  }

  async function accept() {
    if (
      !valid ||
      !params.pieceId ||
      !params.brandId ||
      !isPieceCondition(params.condition) ||
      !isPieceStyle(params.style)
    ) {
      return setError('Dados da peça indisponíveis. Precifique novamente.');
    }
    if (amount === null || amount <= 0)
      return setError('Informe um preço final maior que zero.');
    setSaving(true);
    setError(null);
    try {
      await pricePiece(params.pieceId, {
        brandId: params.brandId,
        condition: params.condition,
        style: params.style,
        acquisitionPrice: cost,
        salePrice: amount,
      });
      router.replace({
        pathname: '/inventory/detail',
        params: { pieceId: params.pieceId, priced: '1' },
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar o preço.',
      );
    } finally {
      setSaving(false);
    }
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
            <View style={[s.header, { width: contentWidth }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar para precificar"
                onPress={goBack}
                style={s.back}
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
              <View>
                <Text accessibilityRole="header" style={s.title}>
                  Preço sugerido
                </Text>
                <Text style={s.mode}>
                  {params.mode === 'quick' ? 'PEÇA AVULSA' : 'PEÇA DO ESTOQUE'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[s.body, { width: contentWidth }]}>
            {!valid ? (
              <AppFeedback
                compact
                variant="error"
                title="Dados da peça indisponíveis. Volte e precifique novamente."
              />
            ) : (
              <>
                <View style={s.priceCard}>
                  <Text style={s.eyebrow}>VALOR SUGERIDO PARA VENDA</Text>
                  <Text style={s.bigPrice}>{currency(suggested)}</Text>
                  <Text style={s.description}>
                    {params.brandName} · {conditionLabel} · {styleLabel}
                  </Text>
                </View>

                <View style={s.summaryCard}>
                  <View style={s.row}>
                    <Text style={s.rowLabel}>Valor de aquisição</Text>
                    <Text style={s.rowValue}>{currency(cost)}</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.rowLabel}>Valor sugerido</Text>
                    <Text style={s.rowValue}>{currency(suggested)}</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.rowLabel}>Índice de valorização</Text>
                    <Text style={s.rowValue}>{score} pontos</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.rowLabel}>Valorização sugerida</Text>
                    <Text style={s.rowValue}>{suggestedPercent}%</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.rowLabel}>Lucro estimado</Text>
                    <Text style={s.rowValue}>{currency(suggested - cost)}</Text>
                  </View>
                </View>

                <View style={s.finalCard}>
                  <Text style={s.fieldLabel}>
                    Preço final (definido por você)
                  </Text>
                  <View style={s.adjustRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Diminuir R$ 5"
                      onPress={() => adjust(-5)}
                      style={s.step}
                    >
                      <Text style={s.stepText}>−5</Text>
                    </Pressable>
                    <TextInput
                      accessibilityLabel="Preço final"
                      keyboardType="decimal-pad"
                      value={finalPrice}
                      onChangeText={setFinalPrice}
                      selectTextOnFocus
                      style={s.priceInput}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Aumentar R$ 5"
                      onPress={() => adjust(5)}
                      style={s.step}
                    >
                      <Text style={s.stepText}>+5</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={s.percentCard}>
                  <Text style={s.rowLabel}>Valorização com preço final</Text>
                  <Text style={s.percentValue}>
                    {finalPercent === null ? '—' : `${finalPercent}%`}
                  </Text>
                </View>

                {error ? (
                  <AppFeedback
                    compact
                    variant="error"
                    title={error}
                    onDismiss={() => setError(null)}
                  />
                ) : null}
                <AppButton
                  title={`Aceitar sugestão · ${amount !== null && amount > 0 ? currency(amount) : '—'}`}
                  onPress={accept}
                  loading={saving}
                />
              </>
            )}
            <AppButton
              title="Precificar novamente"
              variant="secondary"
              onPress={goBack}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF5F3' },
  flex: { flex: 1 },
  content: { alignItems: 'center', paddingBottom: 30, flexGrow: 1 },
  hero: {
    width: '100%',
    height: 118,
    backgroundColor: colors.surface.selected,
    paddingTop: 14,
    alignItems: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    color: colors.text.primary,
  },
  mode: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    letterSpacing: 1.3,
    color: colors.text.secondary,
  },
  body: { maxWidth: 420, marginTop: -15, gap: 12 },
  priceCard: {
    minHeight: 95,
    borderRadius: 17,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  eyebrow: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9,
    color: '#CBBDB7',
  },
  bigPrice: {
    fontFamily: fontFamilies.display,
    fontSize: 38,
    color: colors.text.inverse,
    lineHeight: 44,
  },
  description: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: '#CBBDB7',
  },
  summaryCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: 17,
    padding: 14,
    gap: 7,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  rowValue: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    color: colors.text.primary,
  },
  finalCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: 17,
    padding: 14,
    gap: 9,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  fieldLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    color: colors.text.primary,
  },
  adjustRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  step: {
    width: 36,
    height: 38,
    borderRadius: 15,
    backgroundColor: colors.surface.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
    color: colors.text.primary,
  },
  priceInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 14,
    textAlign: 'center',
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 17,
    color: colors.text.primary,
  },
  percentCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.text.primary,
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  percentValue: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    color: colors.brand.olive,
  },
});
