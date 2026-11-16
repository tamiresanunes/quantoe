import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import { useStores } from '@/features/stores/store-context';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

export default function PricePieceScreen() {
  const { pieceId } = useLocalSearchParams<{ pieceId?: string }>();
  const { activePieces, setPiecePrice } = useStores();
  const { heroHeight, contentWidth, cardPadding } = useResponsiveLayout();
  const piece = activePieces.find((item) => item.id === pieceId);
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const raw = price.trim();
    const normalized = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(raw)
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(',', '.');
    const amount = Number(normalized);
    if (
      !/^\d+(\.\d{1,2})?$/.test(normalized) ||
      !Number.isFinite(amount) ||
      amount <= 0
    )
      return setError('Informe um preço de venda válido.');
    if (!piece) return setError('Peça não encontrada nesta loja.');
    setSaving(true);
    setError(null);
    try {
      await setPiecePrice(piece.id, amount);
      router.replace({ pathname: '/inventory', params: { priced: '1' } });
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
          <View style={[s.hero, { height: heroHeight }]}>
            <Text accessibilityRole="header" style={s.title}>
              Precificar peça
            </Text>
            <Text style={s.subtitle}>
              {piece?.name ?? 'Peça não encontrada'}
            </Text>
          </View>
          <View
            style={[
              s.card,
              {
                width: contentWidth,
                padding: cardPadding,
                marginTop: 104 - heroHeight,
              },
            ]}
          >
            <AppTextField
              label="Preço de venda (R$)"
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={price}
              onChangeText={setPrice}
            />
            {error ? (
              <AppFeedback
                compact
                variant="error"
                title={error}
                onDismiss={() => setError(null)}
              />
            ) : null}
            <AppButton
              title="Salvar preço"
              onPress={save}
              loading={saving}
              disabled={!piece}
            />
            <AppButton
              title="Voltar ao estoque"
              variant="secondary"
              onPress={() => router.replace('/inventory')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 17,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  card: {
    maxWidth: 420,
    gap: 16,
    backgroundColor: colors.surface.primary,
    borderRadius: 19,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 9,
    elevation: 3,
  },
});
