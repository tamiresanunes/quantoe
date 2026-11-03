import { Children, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { colors } from '@/theme/colors';
import { componentSizes, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type AppListProps = { children: ReactNode; emptyMessage?: string };
type AppListItemProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
};

export function AppList({
  children,
  emptyMessage = 'Nenhum item encontrado.',
}: AppListProps) {
  return (
    <View style={styles.list}>
      {Children.count(children) > 0 ? children : (
        <EmptyState title={emptyMessage} />
      )}
    </View>
  );
}

export function AppListItem({
  title,
  subtitle,
  trailing,
  onPress,
}: AppListItemProps) {
  const content = (
    <>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </>
  );
  if (onPress)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  return <View style={styles.item}>{content}</View>;
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  item: {
    minHeight: componentSizes.touchTarget,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  copy: { flex: 1, gap: spacing.xxs },
  title: { ...textStyles.body, color: colors.text.primary },
  subtitle: { ...textStyles.bodySecondary, color: colors.text.secondary },
  pressed: { opacity: 0.7 },
});
