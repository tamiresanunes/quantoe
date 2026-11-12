import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { componentSizes, radii, spacing } from '@/theme/spacing';
import { fontFamilies, textStyles } from '@/theme/typography';

export type AppFeedbackProps = {
  variant: 'success' | 'error';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  /** Apresentação discreta para avisos dentro de formulários. */
  compact?: boolean;
};

export function AppFeedback({
  variant,
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
  compact = false,
}: AppFeedbackProps) {
  const tone = colors.semantic[variant];
  const noticeKey = `${variant}:${title}:${message ?? ''}`;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const onDismissRef = useRef(onDismiss);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDismissedKey(noticeKey);
      onDismissRef.current?.();
    }, 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [noticeKey]);

  if (dismissedKey === noticeKey) return null;

  function dismiss() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setDismissedKey(noticeKey);
    onDismissRef.current?.();
  }

  return (
    <View
      style={[
        styles.container,
        compact && styles.compactContainer,
        { backgroundColor: tone.background, borderColor: tone.foreground },
      ]}
    >
      <View style={[styles.content, compact && styles.compactContent]}>
        <Text
          accessibilityRole="alert"
          style={[
            styles.title,
            compact && styles.compactTitle,
            { color: tone.foreground },
          ]}
        >
          {title}
        </Text>
        {message ? (
          <Text style={[styles.message, compact && styles.compactMessage]}>
            {message}
          </Text>
        ) : null}
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
          hitSlop={compact ? 8 : undefined}
          onPress={dismiss}
          style={[styles.dismiss, compact && styles.compactDismiss]}
        >
          <Text
            style={[
              styles.dismissLabel,
              compact && styles.compactDismissLabel,
              { color: tone.foreground },
            ]}
          >
            ×
          </Text>
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
  compactContainer: {
    borderWidth: 0,
    borderLeftWidth: 2,
    borderRadius: 10,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 4,
    gap: 4,
    alignItems: 'center',
  },
  compactContent: { gap: 2 },
  compactTitle: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    lineHeight: 15,
  },
  compactMessage: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  compactDismiss: { width: 28, height: 28 },
  compactDismissLabel: { fontSize: 18, lineHeight: 22 },
});
