import { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { useResponsiveLayout } from '@/theme/responsive';

type AppModalProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  titleStyle?: StyleProp<TextStyle>;
};

export function AppModal({
  visible,
  title,
  children,
  onClose,
  titleStyle,
}: AppModalProps) {
  const { compact } = useResponsiveLayout();
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={[styles.overlay, compact && styles.compactOverlay]}>
        <Pressable
          accessibilityLabel="Fechar diálogo"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.panel, compact && styles.compactPanel]}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={[styles.title, titleStyle]}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              hitSlop={12}
              onPress={onClose}
              style={styles.closeButton}
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
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(51, 42, 37, 0.55)',
  },
  compactOverlay: { padding: spacing.sm },
  panel: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.modal,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '80%',
  },
  compactPanel: { padding: spacing.md, maxHeight: '90%' },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...textStyles.h3, color: colors.text.primary, flex: 1 },
  closeButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: { ...textStyles.h3, color: colors.text.secondary },
});
