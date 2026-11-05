import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppModal } from '@/components/app-modal';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { width, fontScale } = useWindowDimensions();
  const stackActions = width < 390 || fontScale > 1.2;
  return (
    <AppModal visible={visible} title={title} onClose={onCancel}>
      <Text style={styles.message}>{message}</Text>
      <View style={[styles.actions, stackActions && styles.actionsStacked]}>
        <AppButton
          title={cancelLabel}
          variant="secondary"
          onPress={onCancel}
          disabled={loading}
          style={stackActions ? styles.stackedAction : styles.action}
        />
        <AppButton
          title={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          onPress={onConfirm}
          loading={loading}
          style={stackActions ? styles.stackedAction : styles.action}
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  message: { ...textStyles.body, color: colors.text.secondary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionsStacked: { flexDirection: 'column-reverse' },
  action: { flex: 1 },
  stackedAction: { width: '100%' },
});
