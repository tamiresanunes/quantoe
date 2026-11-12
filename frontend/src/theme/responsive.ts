import { useWindowDimensions } from 'react-native';

/** Referência de projeto em pontos lógicos; nunca fixa o tamanho da tela. */
export const designScreen = { width: 393, height: 852 } as const;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const compact = width < 360 || height < 700;

  return {
    width,
    height,
    compact,
    heroHeight: Math.round(height * 0.3),
    authCardWidth: Math.min(Math.round(width * 0.9), 400),
    contentWidth: Math.min(Math.round(width * 0.9), 420),
    narrowCardWidth: Math.min(Math.round(width * 0.88), 404),
    cardPadding: compact ? 12 : 16,
  };
}
