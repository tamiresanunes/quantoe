import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import { componentSizes, layout, radii, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export type AppTextFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
  error?: string;
};

export function AppTextField({
  label,
  helperText,
  error,
  editable = true,
  style,
  ...inputProps
}: AppTextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !editable }}
        editable={editable}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        placeholderTextColor={colors.text.auxiliary}
        selectionColor={colors.brand.terracotta}
        style={[
          styles.input,
          focused && styles.focused,
          !!error && styles.invalid,
          !editable && styles.disabled,
          style,
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: layout.labelGap },
  label: { ...textStyles.label, color: colors.text.primary },
  input: {
    ...textStyles.body,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.field,
    color: colors.text.primary,
    minHeight: componentSizes.field,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  focused: { borderColor: colors.border.selected, borderWidth: 2 },
  invalid: { borderColor: colors.semantic.error.foreground },
  disabled: { opacity: 0.5 },
  helper: { ...textStyles.caption, color: colors.text.auxiliary },
  error: { ...textStyles.caption, color: colors.semantic.error.foreground },
});
