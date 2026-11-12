import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ComponentProps } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppButton } from '@/components/app-button';
import { AppModal } from '@/components/app-modal';
import { useAuth } from '@/features/auth/auth-context';
import { useStores } from '@/features/stores/store-context';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

type SymbolName = ComponentProps<typeof SymbolView>['name'];
type MenuItem = { label: string; icon: SymbolName; action: () => void };

function MenuGroup({ items }: { items: MenuItem[] }) {
  return (
    <View style={styles.menuGroup}>
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          onPress={item.action}
          style={[styles.menuRow, index > 0 && styles.menuDivider]}
        >
          <View style={styles.menuIcon} pointerEvents="none">
            <SymbolView
              name={item.icon}
              size={15}
              tintColor={colors.action.secondary}
            />
          </View>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <View pointerEvents="none">
            <SymbolView
              name={{
                ios: 'chevron.right',
                android: 'chevron_right',
                web: 'chevron_right',
              }}
              size={15}
              tintColor={colors.text.secondary}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const { heroHeight, contentWidth } = useResponsiveLayout();
  const { user, signOut } = useAuth();
  const { stores, activeStore } = useStores();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const storeCount = stores.length;
  const storeSummary = activeStore
    ? `${activeStore.name} · ${storeCount} ${storeCount === 1 ? 'loja' : 'lojas'}`
    : storeCount > 0
      ? `${storeCount} ${storeCount === 1 ? 'loja' : 'lojas'}`
      : 'Nenhuma loja cadastrada';
  const firstLetter =
    user?.name?.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.hero, { height: heroHeight }]}>
          <Text accessibilityRole="header" style={styles.pageTitle}>
            Perfil
          </Text>
        </View>
        <View
          style={[
            styles.profileContent,
            { width: contentWidth, marginTop: 60 - heroHeight },
          ]}
        >
          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              {user?.photoUrl ? (
                <Image
                  source={{ uri: user.photoUrl }}
                  style={styles.avatarImage}
                  accessibilityLabel="Foto de perfil"
                />
              ) : (
                <Text style={styles.avatarLetter}>{firstLetter}</Text>
              )}
            </View>
            <View style={styles.identityText}>
              <Text numberOfLines={1} style={styles.userName}>
                {user?.name || 'Seu perfil'}
              </Text>
              <Text numberOfLines={1} style={styles.userEmail}>
                {user?.email || ''}
              </Text>
              <Text numberOfLines={1} style={styles.storeSummary}>
                {storeSummary}
              </Text>
            </View>
          </View>

          <MenuGroup
            items={[
              {
                label: 'Meus dados',
                icon: {
                  ios: 'person',
                  android: 'person_outline',
                  web: 'person_outline',
                },
                action: () => router.push('/profile/edit'),
              },
              {
                label: 'Minhas lojas',
                icon: {
                  ios: 'storefront',
                  android: 'storefront',
                  web: 'storefront',
                },
                action: () => router.push('/stores'),
              },
              {
                label: 'Preferências de estoque',
                icon: {
                  ios: 'shippingbox',
                  android: 'inventory_2',
                  web: 'inventory_2',
                },
                action: () => router.push('/profile/preferences'),
              },
            ]}
          />
          <MenuGroup
            items={[
              {
                label: 'Categorias',
                icon: {
                  ios: 'square.stack.3d.up',
                  android: 'layers',
                  web: 'layers',
                },
                action: () => router.push('/profile/categories'),
              },
              {
                label: 'Marcas',
                icon: { ios: 'tag', android: 'sell', web: 'sell' },
                action: () => setOpenSection('Marcas'),
              },
            ]}
          />
          <MenuGroup
            items={[
              {
                label: 'Configurações',
                icon: {
                  ios: 'gearshape',
                  android: 'settings',
                  web: 'settings',
                },
                action: () => setOpenSection('Configurações'),
              },
            ]}
          />
        </View>
      </ScrollView>
      <AppBottomNav active="profile" />
      <AppModal
        visible={openSection !== null}
        title={openSection || ''}
        onClose={() => setOpenSection(null)}
        titleStyle={styles.modalTitle}
      >
        {openSection === 'Configurações' ? (
          <AppButton
            title="Sair da conta"
            variant="secondary"
            onPress={async () => {
              await signOut();
              setOpenSection(null);
              router.replace('/auth/login');
            }}
          />
        ) : (
          <Text style={styles.comingSoon}>
            Esta seção estará disponível em breve.
          </Text>
        )}
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 25 },
  hero: {
    width: '100%',
    paddingHorizontal: 14,
    paddingTop: 11,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  pageTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 21,
    lineHeight: 29,
    color: colors.text.primary,
  },
  profileContent: { width: '90%', maxWidth: 420, gap: 13 },
  identityCard: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 19,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 48, height: 48 },
  avatarLetter: {
    color: colors.text.inverse,
    fontFamily: fontFamilies.display,
    fontSize: 21,
  },
  identityText: { flex: 1, minWidth: 0 },
  userName: {
    color: colors.text.primary,
    fontFamily: fontFamilies.display,
    fontSize: 16,
    lineHeight: 20,
  },
  userEmail: {
    color: colors.text.secondary,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 9,
    lineHeight: 13,
  },
  storeSummary: {
    color: colors.action.secondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    lineHeight: 13,
  },
  menuGroup: {
    borderRadius: 18,
    backgroundColor: colors.surface.primary,
    overflow: 'hidden',
    shadowColor: colors.text.primary,
    shadowOpacity: 0.09,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  menuRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  menuDivider: { borderTopWidth: 1, borderTopColor: colors.border.default },
  menuIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  modalTitle: { fontFamily: fontFamilies.display, fontSize: 19 },
  comingSoon: {
    color: colors.text.secondary,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    lineHeight: 19,
  },
});
