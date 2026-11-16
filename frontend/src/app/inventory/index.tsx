import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppFeedback } from '@/components/app-feedback';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useStores } from '@/features/stores/store-context';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

export default function InventoryScreen() {
  const { created, priced } = useLocalSearchParams<{
    created?: string;
    priced?: string;
  }>();
  const { activeStore, activePieces, loading, error } = useStores();
  const { contentWidth, heroHeight } = useResponsiveLayout();
  const [notice, setNotice] = useState(created === '1' || priced === '1');

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={[s.hero, { height: heroHeight }]}>
          <View style={s.header}>
            <View>
              <Text accessibilityRole="header" style={s.title}>
                Estoque
              </Text>
              <Text style={s.subtitle}>
                {activeStore?.name ?? 'Selecione uma loja'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cadastrar nova peça"
              onPress={() => router.push('/inventory/new')}
              style={s.add}
            >
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={21}
                tintColor={colors.text.inverse}
              />
            </Pressable>
          </View>
        </View>
        <View
          style={[s.list, { width: contentWidth, marginTop: 100 - heroHeight }]}
        >
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
          {loading ? (
            <LoadingState message="Carregando estoque..." />
          ) : error ? (
            <AppFeedback compact variant="error" title={error} />
          ) : !activeStore ? (
            <EmptyState
              title="Nenhuma loja ativa"
              message="Cadastre ou selecione uma loja para organizar as peças."
            />
          ) : activePieces.length === 0 ? (
            <EmptyState
              title="Seu estoque está vazio"
              message="Cadastre a primeira peça desta loja."
            />
          ) : (
            activePieces.map((piece) => (
              <Pressable
                key={piece.id}
                accessibilityRole="button"
                accessibilityLabel={`Ver resumo de ${piece.name}`}
                onPress={() =>
                  router.push({
                    pathname: '/inventory/detail',
                    params: { pieceId: piece.id },
                  })
                }
                style={s.piece}
              >
                <View style={s.pieceTop}>
                  <Text style={s.pieceName}>{piece.name}</Text>
                  <Text style={s.code}>{piece.code ?? 'Peça de exemplo'}</Text>
                </View>
                <Text style={s.pieceInfo}>
                  {piece.quantity ? `${piece.quantity} un. · ` : ''}
                  {piece.size ? `Tam. ${piece.size} · ` : ''}
                  {piece.status === 'sold'
                    ? 'Vendida'
                    : piece.status === 'reserved'
                      ? 'Reservada'
                      : piece.status === 'clearance'
                        ? 'Liquidação'
                        : 'Livre'}
                </Text>
                {piece.salePrice !== undefined ? (
                  <Text style={s.price}>
                    {piece.salePrice.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </Text>
                ) : null}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
      <AppBottomNav active="inventory" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { alignItems: 'center', paddingBottom: 24, flexGrow: 1 },
  hero: {
    width: '100%',
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 17,
    paddingTop: 12,
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
  subtitle: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  add: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { maxWidth: 420, gap: 12 },
  piece: {
    backgroundColor: colors.surface.primary,
    borderRadius: 17,
    padding: 16,
    gap: 6,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 2,
  },
  pieceTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  pieceName: {
    flex: 1,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
    color: colors.text.primary,
  },
  code: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.action.secondary,
  },
  pieceInfo: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  price: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    color: colors.action.secondary,
  },
});
