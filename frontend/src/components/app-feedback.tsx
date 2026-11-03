import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { componentSizes, radii, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export type AppFeedbackProps = {
  variant: 'success' | 'error';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
};

export function AppFeedback({
  variant,
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
}: AppFeedbackProps) {
  const tone = colors.semantic[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: tone.background, borderColor: tone.foreground },
      ]}
    >
      <View style={styles.content}>
        <Text accessibilityRole="alert" style={[styles.title, { color: tone.foreground }]}>
          {title}
        </Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={styles.action}
          >
            <Text style={[styles.actionLabel, { color: tone.foreground }]}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dispensar aviso"
          onPress={onDismiss}
          style={styles.dismiss}
        >
          <Text style={[styles.dismissLabel, { color: tone.foreground }]}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  content: { flex: 1, gap: spacing.xs },
  title: { ...textStyles.subtitle },
  message: { ...textStyles.bodySecondary, color: colors.text.primary },
  action: {
    alignSelf: 'flex-start',
    minHeight: componentSizes.touchTarget,
    justifyContent: 'center',
  },
  actionLabel: { ...textStyles.label, textDecorationLine: 'underline' },
  dismiss: {
    width: componentSizes.touchTarget,
    height: componentSizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissLabel: { ...textStyles.h3 },
});
