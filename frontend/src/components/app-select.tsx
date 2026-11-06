import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
  compact?: boolean;
  searchable?: boolean;
  onChange: (value: string) => void;
};

export function AppSelect({
  label,
  options,
  value,
  placeholder = 'Selecione uma opção',
  error,
  disabled = false,
  compact = false,
  searchable = false,
  onChange,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const normalizedQuery = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
  const visibleOptions = normalizedQuery
    ? options.filter((option) =>
        option.label
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedQuery),
      )
    : options;
  function close() {
    setOpen(false);
    setQuery('');
  }
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Text style={[styles.label, compact && styles.compactLabel]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={
          error ? `${error}. Abre a lista de opções` : 'Abre a lista de opções'
        }
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          compact && styles.compactTrigger,
          !!error && styles.invalid,
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.value,
            !selected && styles.placeholder,
            compact && styles.compactValue,
          ]}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <AppModal visible={open} title={label} onClose={close}>
        {searchable ? (
          <TextInput
            accessibilityLabel={`Buscar ${label.toLowerCase()}`}
            onChangeText={setQuery}
            placeholder="Buscar..."
            placeholderTextColor={colors.text.auxiliary}
            selectionColor={colors.brand.terracotta}
            style={styles.searchInput}
            value={query}
          />
        ) : null}
        <FlatList
          data={visibleOptions}
          keyExtractor={(item) => item.value}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: item.value === value }}
              onPress={() => {
                onChange(item.value);
                close();
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
  compactContainer: { gap: spacing.xxs },
  label: { ...textStyles.label, color: colors.text.primary },
  compactLabel: { fontSize: 11 },
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
  compactTrigger: {
    minHeight: 38,
    borderRadius: 13,
    borderColor: colors.border.default,
  },
  value: { ...textStyles.body, color: colors.text.primary, flex: 1 },
  compactValue: { fontSize: 11 },
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
  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.field,
    paddingHorizontal: spacing.sm,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
  },
  error: { ...textStyles.caption, color: colors.semantic.error.foreground },
});
