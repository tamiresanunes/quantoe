import Constants from 'expo-constants';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFeedback } from '@/components/app-feedback';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useAuth } from '@/features/auth/auth-context';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

type SymbolName = ComponentProps<typeof SymbolView>['name'];
type SettingItem = { label: string; icon: SymbolName; onPress: () => void };

function SettingRow({
  item,
  divided = false,
}: {
  item: SettingItem;
  divided?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={item.onPress}
      style={[s.row, divided && s.divider]}
    >
      <View style={s.iconCircle} pointerEvents="none">
        <SymbolView
          name={item.icon}
          size={15}
          tintColor={colors.action.primary}
        />
      </View>
      <Text style={s.rowText}>{item.label}</Text>
      <SymbolView
        name={{
          ios: 'chevron.right',
          android: 'chevron_right',
          web: 'chevron_right',
        }}
        size={14}
        tintColor={colors.text.secondary}
      />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { contentWidth } = useResponsiveLayout();
  const { signOut } = useAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const version = Constants.expoConfig?.version ?? '1.0.0';

  async function handleSignOut() {
    setSigningOut(true);
    setError('');
    try {
      await signOut();
      setConfirmSignOut(false);
      router.replace('/auth/login');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível sair da conta.',
      );
      setConfirmSignOut(false);
    } finally {
      setSigningOut(false);
    }
  }

  const items: SettingItem[] = [
    {
      label: 'Notificações',
      icon: {
        ios: 'bell',
        android: 'notifications_none',
        web: 'notifications_none',
      },
      onPress: () => router.push('/profile/preferences'),
    },
    {
      label: 'Segurança',
      icon: { ios: 'shield', android: 'shield', web: 'shield' },
      onPress: () => router.push('/profile/edit'),
    },
    {
      label: 'Ajuda e suporte',
      icon: {
        ios: 'questionmark.circle',
        android: 'help_outline',
        web: 'help_outline',
      },
      onPress: () => router.push('/profile/help'),
    },
  ];

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.heroBackdrop} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={[s.inner, { width: contentWidth }]}>
          <View style={s.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar ao perfil"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/profile')
              }
              style={s.back}
            >
              <SymbolView
                name={{
                  ios: 'chevron.left',
                  android: 'arrow_back',
                  web: 'arrow_back',
                }}
                size={18}
                tintColor={colors.action.primary}
              />
            </Pressable>
            <Text accessibilityRole="header" style={s.title}>
              Configurações
            </Text>
          </View>

          {error ? (
            <AppFeedback
              compact
              variant="error"
              title={error}
              onDismiss={() => setError('')}
            />
          ) : null}

          <View style={s.group}>
            {items.map((item, index) => (
              <SettingRow key={item.label} item={item} divided={index > 0} />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            onPress={() => setConfirmSignOut(true)}
            style={s.signOutRow}
          >
            <View style={s.iconCircle} pointerEvents="none">
              <SymbolView
                name={{
                  ios: 'rectangle.portrait.and.arrow.right',
                  android: 'logout',
                  web: 'logout',
                }}
                size={15}
                tintColor={colors.semantic.error.foreground}
              />
            </View>
            <Text style={s.signOutText}>Sair da conta</Text>
          </Pressable>

          <Text style={s.version}>Quanto É · versão {version}</Text>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmSignOut}
        title="Sair da conta?"
        message="Você poderá entrar novamente com seu e-mail e senha."
        confirmLabel="Sair"
        destructive
        loading={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  heroBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 32 },
  inner: { maxWidth: 420, gap: 14, paddingTop: 11 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 23,
    color: colors.text.primary,
  },
  group: {
    borderRadius: 18,
    backgroundColor: colors.surface.primary,
    overflow: 'hidden',
    shadowColor: colors.text.primary,
    shadowOpacity: 0.09,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  row: {
    minHeight: 49,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border.default },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  signOutRow: {
    minHeight: 49,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 18,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.09,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  signOutText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.semantic.error.foreground,
  },
  version: {
    alignSelf: 'center',
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.auxiliary,
  },
});
