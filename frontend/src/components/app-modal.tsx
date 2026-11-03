import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type AppModalProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function AppModal({ visible, title, children, onClose }: AppModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Fechar diálogo"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.panel}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              hitSlop={12}
              onPress={onClose}
            >
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(51, 42, 37, 0.55)',
  },
  panel: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.modal,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '80%',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...textStyles.h3, color: colors.text.primary, flex: 1 },
  close: { ...textStyles.h3, color: colors.text.secondary },
});
