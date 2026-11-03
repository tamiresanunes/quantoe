import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type AppHeaderProps = { title: string; subtitle?: string; action?: ReactNode };

export function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  copy: { flex: 1, gap: spacing.xs },
  title: { ...textStyles.h1, color: colors.text.primary },
  subtitle: { ...textStyles.body, color: colors.text.secondary },
});
