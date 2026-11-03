import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppModal } from '@/components/app-modal';
import { colors } from '@/theme/colors';
import { componentSizes, layout, radii, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export type SelectOption = { label: string; value: string };

type AppSelectProps = {
  label: string;
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function AppSelect({
  label,
  options,
  value,
  placeholder = 'Selecione uma opção',
  error,
  disabled = false,
  onChange,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Abre a lista de opções"
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          !!error && styles.invalid,
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <AppModal visible={open} title={label} onClose={() => setOpen(false)}>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: item.value === value }}
              onPress={() => {
                onChange(item.value);
                setOpen(false);
              }}
              style={({ pressed }) => [
                styles.option,
                item.value === value && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.value}>{item.label}</Text>
              {item.value === value ? (
                <Text style={styles.check}>✓</Text>
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.placeholder}>Nenhuma opção disponível.</Text>
          }
        />
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: layout.labelGap },
  label: { ...textStyles.label, color: colors.text.primary },
  trigger: {
    minHeight: componentSizes.field,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.field,
    backgroundColor: colors.surface.primary,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: { ...textStyles.body, color: colors.text.primary, flex: 1 },
  placeholder: { ...textStyles.body, color: colors.text.auxiliary },
  chevron: { ...textStyles.h3, color: colors.text.secondary },
  check: { ...textStyles.body, color: colors.action.primary },
  option: {
    minHeight: componentSizes.touchTarget,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.field,
  },
  optionSelected: { backgroundColor: colors.surface.selected },
  invalid: { borderColor: colors.semantic.error.foreground },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  error: { ...textStyles.caption, color: colors.semantic.error.foreground },
});
