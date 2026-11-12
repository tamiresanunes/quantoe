import type { ComponentProps } from 'react';
import type { SymbolView } from 'expo-symbols';

import { colors } from '@/theme/colors';
import type { CategoryIcon } from '@/types/models';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export const categoryIcons: readonly {
  value: CategoryIcon;
  label: string;
  symbol: SymbolName;
}[] = [
  {
    value: 'clothing',
    label: 'Roupa',
    symbol: { ios: 'tshirt', android: 'checkroom', web: 'checkroom' },
  },
  {
    value: 'jewelry',
    label: 'Joia',
    symbol: { ios: 'diamond', android: 'diamond', web: 'diamond' },
  },
  {
    value: 'bag',
    label: 'Bolsa',
    symbol: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
  },
  {
    value: 'shoes',
    label: 'Calçado',
    symbol: {
      ios: 'figure.walk',
      android: 'directions_walk',
      web: 'directions_walk',
    },
  },
  {
    value: 'watch',
    label: 'Relógio',
    symbol: { ios: 'applewatch', android: 'watch', web: 'watch' },
  },
  {
    value: 'sparkles',
    label: 'Outros',
    symbol: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  },
];

export const categoryColors = [
  { label: 'Terracota', value: colors.action.primary },
  { label: 'Oliva', value: colors.brand.olive },
  { label: 'Café', value: colors.brand.coffee },
  { label: 'Verde', value: '#5B7B5B' },
  { label: 'Ocre', value: '#D3973D' },
  { label: 'Areia', value: '#C5A58F' },
] as const;
