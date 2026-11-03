import { StyleSheet } from 'react-native';

import { colors } from '/colors';
import { componentSizes, layout, radii, spacing } from '/spacing';
import { textStyles } from '/typography';

/** Estilos básicos compartilhados pelas telas. */
export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenHorizontal,
    paddingVertical: spacing.lg,
    gap: layout.fieldGap,
  },
  headingGroup: {
    gap: layout.titleGap,
  },
  title: {
    ...textStyles.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...textStyles.subtitle,
    color: colors.text.primary,
  },
  body: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  input: {
    ...textStyles.body,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.field,
    color: colors.text.primary,
    minHeight: componentSizes.field,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.card,
    padding: layout.cardPadding,
    gap: spacing.xs,
  },
  error: {
    ...textStyles.bodySecondary,
    color: colors.semantic.error.foreground,
  },
});
