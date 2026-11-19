import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { colors } from '@/theme/colors';

type FixedTopBandProps = { height: number };

/** Faixa decorativa fixa, posicionada atrás do conteúdo rolável. */
export function FixedTopBand({ height }: FixedTopBandProps) {
  const { width } = useWindowDimensions();
  const topOverscan = Math.ceil(width * 0.08);

  return (
    <View
      pointerEvents="none"
      style={[styles.band, { top: -topOverscan, height: height + topOverscan }]}
    />
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    right: 0,
    left: 0,
    backgroundColor: colors.brand.earth,
    borderBottomLeftRadius: 88,
    borderBottomRightRadius: 88,
    transform: [{ skewY: '-5deg' }],
  },
});
