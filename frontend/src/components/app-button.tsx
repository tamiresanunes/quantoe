import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { colors } from '@/theme/colors';
import { componentSizes, radii, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export type AppButtonProps = {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  size?: 'default' | 'small';
  style?: ViewStyle;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'default',
  style,
}: AppButtonProps) {
  const inactive = disabled || loading;
  const foreground =
    variant === 'primary'
      ? colors.text.inverse
      : variant === 'danger'
        ? colors.semantic.error.foreground
        : colors.action.secondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'small' && styles.small,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        pressed &&
          (variant === 'primary'
            ? styles.primaryPressed
            : styles.outlinePressed),
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text style={[styles.label, { color: foreground }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: componentSizes.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.action.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  small: { minHeight: componentSizes.buttonSmall, paddingVertical: spacing.xs },
  primary: { backgroundColor: colors.action.primary },
  primaryPressed: {
    backgroundColor: colors.action.primaryPressed,
    borderColor: colors.action.primaryPressed,
  },
  secondary: { backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  danger: {
    backgroundColor: 'transparent',
    borderColor: colors.semantic.error.foreground,
  },
  outlinePressed: { backgroundColor: colors.surface.selected },
  disabled: { opacity: 0.5 },
  label: { ...textStyles.button, textAlign: 'center' },
});
