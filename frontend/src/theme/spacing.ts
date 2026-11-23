/** Escala em dp no React Native (equivalente aos px de design). */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  huge: 64,
} as const;

export const layout = {
  screenHorizontal: 20,
  screenTop: 24,
  screenContentGap: 16,
  headerGap: 10,
  headerToCard: 24,
  headerButton: 36,
  headerIcon: 18,
  sectionGap: spacing.lg,
  cardGap: spacing.sm,
  cardPadding: spacing.md,
  fieldGap: spacing.md,
  labelGap: spacing.xs,
  titleGap: spacing.xs,
} as const;

export const componentSizes = {
  button: 38,
  buttonSmall: 38,
  field: 36,
  touchTarget: 48,
  icon: 24,
} as const;

export const radii = {
  button: 12,
  field: 14,
  card: 16,
  modal: 24,
} as const;
