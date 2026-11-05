import { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/theme/colors';
import { componentSizes, layout, radii, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export type AppTextFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
  error?: string;
  /** Conteúdo no fim do campo, como o botão de mostrar senha. */
  rightAccessory?: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
};

export function AppTextField({
  label,
  helperText,
  error,
  rightAccessory,
  labelStyle,
  fieldStyle,
  editable = true,
  style,
  ...inputProps
}: AppTextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <View
        style={[
          styles.field,
          fieldStyle,
          focused && styles.focused,
          !!error && styles.invalid,
          !editable && styles.disabled,
        ]}
      >
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          accessibilityHint={error || helperText}
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
          style={[styles.input, style]}
        />
        {rightAccessory}
      </View>
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.field,
    overflow: 'hidden',
    minHeight: componentSizes.field,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
  },
  input: {
    ...textStyles.body,
    flex: 1,
    minWidth: 0,
    minHeight: componentSizes.field - 4,
    paddingVertical: spacing.xs,
    color: colors.text.primary,
    outlineColor: 'transparent',
    outlineWidth: 0,
  },
  focused: { borderColor: colors.border.selected, borderWidth: 2 },
  invalid: { borderColor: colors.semantic.error.foreground },
  disabled: { opacity: 0.5 },
  helper: { ...textStyles.caption, color: colors.text.auxiliary },
  error: { ...textStyles.caption, color: colors.semantic.error.foreground },
});
