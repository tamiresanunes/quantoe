import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { cardSurface } from '@/theme/card';
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';

export function InventoryLoadingState({ cardWidth }: { cardWidth: number }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando peças do estoque"
      style={s.loading}
    >
      <View style={s.loadingHeading}>
        <ActivityIndicator color={colors.action.primary} size="small" />
        <Text style={s.loadingText}>Carregando peças...</Text>
      </View>
      <View style={s.grid}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={[s.skeletonCard, { width: cardWidth }]}>
            <View style={s.skeletonPhoto} />
            <View style={s.skeletonTitle} />
            <View style={s.skeletonMeta} />
            <View style={s.skeletonMetaShort} />
            <View style={s.skeletonPrice} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function InventoryEmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon = 'inventory',
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  icon?: 'inventory' | 'search';
}) {
  return (
    <View style={s.empty}>
      <View style={s.iconCircle}>
        <SymbolView
          name={
            icon === 'search'
              ? { ios: 'magnifyingglass', android: 'search', web: 'search' }
              : {
                  ios: 'shippingbox',
                  android: 'inventory_2',
                  web: 'inventory_2',
                }
          }
          size={38}
          tintColor={colors.action.primary}
        />
      </View>
      <Text accessibilityRole="header" style={s.emptyTitle}>
        {title}
      </Text>
      <Text style={s.emptyMessage}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onAction} style={s.action}>
        <Text style={s.actionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  loading: { gap: 13 },
  loadingHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  loadingText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    color: colors.text.secondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeletonCard: {
    ...cardSurface,
    padding: 8,
    borderRadius: 18,
    gap: 8,
    backgroundColor: colors.surface.primary,
  },
  skeletonPhoto: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 13,
    backgroundColor: colors.surface.selected,
  },
  skeletonTitle: {
    width: '84%',
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface.selected,
  },
  skeletonMeta: {
    width: '68%',
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.background.secondary,
  },
  skeletonMetaShort: {
    width: '55%',
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.background.secondary,
  },
  skeletonPrice: {
    width: '48%',
    height: 15,
    borderRadius: 7,
    backgroundColor: colors.surface.selected,
    marginTop: 3,
  },
  empty: {
    minHeight: 280,
    borderRadius: 19,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    gap: 10,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface.selected,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyMessage: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  action: {
    minHeight: 37,
    paddingHorizontal: 19,
    borderRadius: 12,
    backgroundColor: colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  actionText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    color: colors.text.inverse,
  },
});
