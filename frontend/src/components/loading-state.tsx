import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export type LoadingStateProps = { message?: string };

export function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={styles.container}
    >
      <ActivityIndicator color={colors.action.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  message: {
    ...textStyles.bodySecondary,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
