import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { layout, radii, spacing } from '@/theme/spacing';

type AppCardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  selected?: boolean;
  style?: ViewStyle;
};

export function AppCard({
  children,
  onPress,
  accessibilityLabel,
  selected = false,
  style,
}: AppCardProps) {
  const cardStyle = [styles.card, selected && styles.selected, style];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.card,
    padding: layout.cardPadding,
    gap: spacing.xs,
  },
  selected: {
    backgroundColor: colors.surface.selected,
    borderColor: colors.border.selected,
  },
  pressed: { opacity: 0.8 },
});
