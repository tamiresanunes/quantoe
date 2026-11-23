import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  conditionLabels,
  isPieceCondition,
  isPieceStyle,
  styleLabels,
} from '@/features/inventory/piece-attributes';
import { cardSurface } from '@/theme/card';
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';
import type { StorePiece } from '@/types/models';

const illustrationColors = [
  colors.illustration.cocoa,
  colors.illustration.gold,
  colors.illustration.clay,
  colors.illustration.sand,
];

export function InventoryPieceCard({
  piece,
  brandName,
  width,
  index,
}: {
  piece: StorePiece;
  brandName: string;
  width: number;
  index: number;
}) {
  const condition = isPieceCondition(piece.condition)
    ? conditionLabels[piece.condition]
    : 'Conservação pendente';
  const style = isPieceStyle(piece.style)
    ? styleLabels[piece.style]
    : 'Estilo pendente';
  const exhausted = piece.quantity === 0 || piece.status === 'sold';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver peça ${piece.name}`}
      onPress={() =>
        router.push({
          pathname: '/inventory/detail',
          params: { pieceId: piece.id },
        })
      }
      style={[s.card, { width }]}
    >
      <View
        style={[
          s.photo,
          {
            backgroundColor:
              illustrationColors[index % illustrationColors.length],
          },
        ]}
      >
        {piece.photoUri ? (
          <Image
            source={{ uri: piece.photoUri }}
            style={s.image}
            resizeMode="cover"
          />
        ) : (
          <SymbolView
            name={{
              ios: 'tshirt.fill',
              android: 'checkroom',
              web: 'checkroom',
            }}
            size={43}
            tintColor={colors.illustration.icon}
          />
        )}
      </View>
      <Text style={s.name} numberOfLines={2}>
        {piece.name}
      </Text>
      <Text style={s.meta} numberOfLines={1}>
        {brandName} ·{' '}
        {piece.quantity === undefined
          ? 'Qtd. pendente'
          : `${piece.quantity} un.`}
      </Text>
      <Text style={s.attribute} numberOfLines={1}>
        {style}
      </Text>
      <Text style={s.attribute} numberOfLines={1}>
        {condition}
      </Text>
      <View style={s.priceRow}>
        <Text style={s.price} numberOfLines={1}>
          {piece.salePrice === undefined
            ? 'Sem preço'
            : piece.salePrice.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
        </Text>
        {exhausted ? <Text style={s.badge}>ESGOTADO</Text> : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: 8,
    borderRadius: 18,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 2,
    gap: 3,
  },
  photo: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 13,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  name: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.text.primary,
    marginTop: 5,
  },
  meta: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  attribute: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.auxiliary,
  },
  priceRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    marginTop: 2,
  },
  price: {
    flexShrink: 1,
    fontFamily: fontFamilies.display,
    fontSize: 15,
    color: colors.text.primary,
  },
  badge: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 7,
    color: colors.semantic.error.foreground,
  },
});
