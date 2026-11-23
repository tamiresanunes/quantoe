import { colors } from '@/theme/colors';

/** Contorno e profundidade suaves para cards sobre a faixa e o fundo. */
export const cardSurface = {
  borderWidth: 1,
  borderColor: colors.border.default,
  shadowColor: colors.text.primary,
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;
