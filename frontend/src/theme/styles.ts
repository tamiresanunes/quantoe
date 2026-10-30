import { StyleSheet } from 'react-native';

import { colors } from './colors';

/** Estilos básicos compartilhados pelas telas. */
export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: 24,
    gap: 16,
  },
  title: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  body: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  input: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: 8,
    color: colors.text.primary,
    fontSize: 16,
    padding: 12,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: 16,
  },
  error: {
    color: colors.semantic.error.foreground,
    fontSize: 16,
  },
});
