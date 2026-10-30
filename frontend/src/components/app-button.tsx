import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

type AppButtonProps = {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}: AppButtonProps) {
  const secondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondary : styles.primary,
        pressed &&
          (secondary ? styles.secondaryPressed : styles.primaryPressed),
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          secondary ? styles.secondaryLabel : styles.primaryLabel,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.action.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primary: { backgroundColor: colors.action.primary },
  primaryPressed: {
    backgroundColor: colors.action.primaryPressed,
    borderColor: colors.action.primaryPressed,
  },
  secondary: { backgroundColor: 'transparent' },
  secondaryPressed: { backgroundColor: colors.surface.selected },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '600' },
  primaryLabel: { color: colors.text.inverse },
  secondaryLabel: { color: colors.action.secondary },
});
