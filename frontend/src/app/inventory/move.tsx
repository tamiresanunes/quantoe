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
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useStores } from '@/features/stores/store-context';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

const entryReasons = [
  { value: 'purchase', label: 'Compra' },
  { value: 'return', label: 'Devolução' },
  { value: 'adjustment', label: 'Ajuste' },
] as const;
const exitReasons = [
  { value: 'sale', label: 'Venda' },
  { value: 'exchange', label: 'Troca' },
  { value: 'damage', label: 'Avaria' },
  { value: 'adjustment', label: 'Ajuste' },
] as const;

export default function MovePieceScreen() {
  const { pieceId } = useLocalSearchParams<{ pieceId?: string }>();
  const {
    activeStore,
    activePieces,
    loading,
    error: storeError,
    movePiece,
  } = useStores();
  const { contentWidth } = useResponsiveLayout();
  const [selectedId, setSelectedId] = useState(pieceId ?? '');
  const [direction, setDirection] = useState<'in' | 'out'>('out');
  const [entryReason, setEntryReason] =
    useState<(typeof entryReasons)[number]['value']>('purchase');
  const [exitReason, setExitReason] =
    useState<(typeof exitReasons)[number]['value']>('sale');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const piece = activePieces.find((item) => item.id === selectedId);
  const current = piece?.quantity ?? 0;
  const amount = /^\d+$/.test(quantity.trim()) ? Number(quantity.trim()) : NaN;
  const validAmount =
    Number.isInteger(amount) && amount >= 1 && amount <= 999_999;
  const next = validAmount
    ? current + (direction === 'in' ? amount : -amount)
    : null;
  const validBalance = next !== null && next >= 0 && next <= 999_999;
  const reasons = direction === 'in' ? entryReasons : exitReasons;
  const selectedReason = direction === 'in' ? entryReason : exitReason;

  function selectPiece(id: string) {
    setSelectedId(id);
    setQuantity('1');
    setNote('');
    setError('');
  }

  function step(delta: number) {
    const base = Number.isFinite(amount) ? amount : 0;
    const limit = direction === 'out' ? current : 999_999 - current;
    setQuantity(String(Math.max(1, Math.min(limit, base + delta))));
    setError('');
  }

  async function confirm() {
    if (!piece) return setError('Selecione uma peça.');
    if (!validAmount)
      return setError('Informe uma quantidade de 1 a 999.999 unidades.');
    if (!validBalance)
      return setError(
        direction === 'out'
          ? 'A saída não pode superar o saldo atual.'
          : 'O saldo não pode superar 999.999 unidades.',
      );
    if (note.trim().length > 500)
      return setError('Use até 500 caracteres na observação.');

    setSaving(true);
    setError('');
    try {
      await movePiece(
        piece.id,
        direction === 'in'
          ? { direction: 'in', quantity: amount, reason: entryReason, note }
          : { direction: 'out', quantity: amount, reason: exitReason, note },
      );
      router.replace({
        pathname: '/inventory/detail',
        params: { pieceId: piece.id, moved: '1' },
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar a movimentação.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.screen}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.heroBackdrop} />
          <View style={[s.inner, { width: contentWidth }]}>
            <View style={s.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                onPress={() =>
                  router.canGoBack()
                    ? router.back()
                    : router.replace('/inventory')
                }
                style={s.back}
              >
                <SymbolView
                  name={{
                    ios: 'chevron.left',
                    android: 'arrow_back',
                    web: 'arrow_back',
                  }}
                  size={18}
                  tintColor={colors.action.primary}
                />
              </Pressable>
              <View style={s.heading}>
                <Text accessibilityRole="header" style={s.title}>
                  Movimentar
                </Text>
                <Text numberOfLines={1} style={s.subtitle}>
                  {piece?.name.toLocaleUpperCase('pt-BR') ??
                    'SELECIONE UMA PEÇA'}
                </Text>
              </View>
            </View>

            {loading ? (
              <LoadingState message="Carregando peças..." />
            ) : storeError ? (
              <AppFeedback compact variant="error" title={storeError} />
            ) : !activeStore ? (
              <EmptyState
                title="Nenhuma loja ativa"
                message="Selecione uma loja para movimentar o estoque."
                actionLabel="Ver minhas lojas"
                onAction={() => router.push('/stores')}
              />
            ) : activePieces.length === 0 ? (
              <EmptyState
                title="Nenhuma peça cadastrada"
                message="Cadastre uma peça antes de registrar entradas ou saídas."
                actionLabel="Cadastrar peça"
                onAction={() => router.push('/inventory/new')}
              />
            ) : pieceId && !piece ? (
              <EmptyState
                title="Peça não encontrada"
                message="Ela pode estar em outra loja. Selecione a loja correta no Estoque."
                actionLabel="Ver estoque"
                onAction={() => router.replace('/inventory')}
              />
            ) : (
              <>
                {!pieceId ? (
                  <View style={s.selectCard}>
                    <Text style={s.label}>Peça</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={s.pieceChoices}>
                        {activePieces.map((item) => (
                          <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            accessibilityState={{
                              selected: selectedId === item.id,
                            }}
                            onPress={() => selectPiece(item.id)}
                            style={[
                              s.pieceChip,
                              selectedId === item.id && s.pieceChipActive,
                            ]}
                          >
                            <Text
                              numberOfLines={1}
                              style={[
                                s.pieceChipText,
                                selectedId === item.id && s.pieceChipTextActive,
                              ]}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[
                                s.pieceChipCount,
                                selectedId === item.id && s.pieceChipTextActive,
                              ]}
                            >
                              {item.quantity ?? 0} un
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : null}

                {piece ? (
                  <>
                    <View style={s.switch}>
                      {(['in', 'out'] as const).map((value) => (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityState={{ selected: direction === value }}
                          onPress={() => {
                            setDirection(value);
                            setQuantity('1');
                            setError('');
                          }}
                          style={[
                            s.switchOption,
                            direction === value && s.switchActive,
                          ]}
                        >
                          <Text
                            style={[
                              s.switchText,
                              direction === value && s.switchTextActive,
                            ]}
                          >
                            {value === 'in' ? 'Entrada' : 'Saída'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <View style={s.quantityCard}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Diminuir quantidade"
                        accessibilityState={{
                          disabled: !validAmount || amount <= 1,
                        }}
                        disabled={!validAmount || amount <= 1}
                        onPress={() => step(-1)}
                        style={s.stepButton}
                      >
                        <Text style={s.stepText}>−</Text>
                      </Pressable>
                      <View style={s.quantityCenter}>
                        <TextInput
                          accessibilityLabel="Quantidade de unidades"
                          keyboardType="number-pad"
                          maxLength={6}
                          selectTextOnFocus
                          value={quantity}
                          onChangeText={(value) => {
                            setQuantity(value);
                            setError('');
                          }}
                          style={s.quantityInput}
                        />
                        <Text style={s.units}>unidades</Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Aumentar quantidade"
                        accessibilityState={{
                          disabled:
                            direction === 'out'
                              ? amount >= current
                              : current + amount >= 999_999,
                        }}
                        disabled={
                          direction === 'out'
                            ? amount >= current
                            : current + amount >= 999_999
                        }
                        onPress={() => step(1)}
                        style={s.stepButton}
                      >
                        <Text style={s.stepText}>+</Text>
                      </Pressable>
                    </View>

                    <View style={s.card}>
                      <Text style={s.label}>Motivo</Text>
                      <View style={s.reasons}>
                        {reasons.map((item) => (
                          <Pressable
                            key={item.value}
                            accessibilityRole="button"
                            accessibilityState={{
                              selected: selectedReason === item.value,
                            }}
                            onPress={() => {
                              if (direction === 'in')
                                setEntryReason(
                                  item.value as typeof entryReason,
                                );
                              else
                                setExitReason(item.value as typeof exitReason);
                            }}
                            style={[
                              s.reasonChip,
                              selectedReason === item.value && s.reasonSelected,
                            ]}
                          >
                            <Text
                              style={[
                                s.reasonText,
                                selectedReason === item.value &&
                                  s.reasonTextSelected,
                              ]}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={s.card}>
                      <Text style={s.label}>Observação</Text>
                      <TextInput
                        accessibilityLabel="Observação opcional"
                        placeholder="Opcional"
                        placeholderTextColor={colors.text.auxiliary}
                        value={note}
                        onChangeText={setNote}
                        maxLength={500}
                        multiline
                        style={s.noteInput}
                      />
                    </View>

                    <View style={s.balance}>
                      <Text style={s.balanceLabel}>Saldo atual → novo</Text>
                      <Text style={s.balanceValue}>
                        {current} → {validBalance ? next : '—'} un
                      </Text>
                    </View>
                    {!validAmount || !validBalance ? (
                      <Text style={s.validation}>
                        {!validAmount
                          ? 'Informe uma quantidade de 1 a 999.999 unidades.'
                          : direction === 'out'
                            ? 'A saída não pode superar o saldo atual.'
                            : 'O saldo não pode superar 999.999 unidades.'}
                      </Text>
                    ) : null}
                    {error ? (
                      <AppFeedback
                        compact
                        variant="error"
                        title={error}
                        onDismiss={() => setError('')}
                      />
                    ) : null}
                    <AppButton
                      title={`Confirmar ${direction === 'in' ? 'entrada' : 'saída'}`}
                      onPress={confirm}
                      loading={saving}
                      disabled={!validAmount || !validBalance}
                    />
                  </>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 35 },
  heroBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  inner: { maxWidth: 420, gap: 15, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.action.primary,
  },
  selectCard: { gap: 8 },
  label: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    color: colors.text.primary,
  },
  pieceChoices: { flexDirection: 'row', gap: 8 },
  pieceChip: {
    width: 122,
    minHeight: 52,
    padding: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
    justifyContent: 'center',
  },
  pieceChipActive: {
    borderColor: colors.text.primary,
    backgroundColor: colors.text.primary,
  },
  pieceChipText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    color: colors.text.primary,
  },
  pieceChipCount: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
    color: colors.text.secondary,
  },
  pieceChipTextActive: { color: colors.text.inverse },
  switch: {
    flexDirection: 'row',
    gap: 5,
    padding: 3,
    borderRadius: 16,
    backgroundColor: colors.surface.selected,
  },
  switchOption: {
    flex: 1,
    height: 35,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: colors.surface.primary,
    elevation: 2,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  switchText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.secondary,
  },
  switchTextActive: { color: colors.text.primary },
  quantityCard: {
    minHeight: 75,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: colors.surface.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.text.primary,
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 17,
    color: colors.text.primary,
  },
  quantityCenter: { alignItems: 'center' },
  quantityInput: {
    minWidth: 65,
    textAlign: 'center',
    fontFamily: fontFamilies.display,
    fontSize: 34,
    color: colors.text.primary,
    padding: 0,
  },
  units: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
    color: colors.text.secondary,
  },
  card: {
    gap: 9,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reasonChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  reasonSelected: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  reasonText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.primary,
  },
  reasonTextSelected: {
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.text.inverse,
  },
  noteInput: {
    minHeight: 38,
    maxHeight: 95,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.primary,
  },
  balance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 13,
    borderRadius: 13,
    backgroundColor: colors.surface.selected,
  },
  balanceLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.primary,
  },
  balanceValue: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    color: colors.text.primary,
  },
  validation: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.semantic.error.foreground,
  },
});
