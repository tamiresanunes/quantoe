import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

type AppBottomNavProps = { active: 'home' | 'profile' };

export function AppBottomNav({ active }: AppBottomNavProps) {
  const { compact } = useResponsiveLayout();
  return (
    <View
      style={[styles.bar, compact && styles.compactBar]}
      accessibilityRole="tablist"
    >
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel="Início"
        accessibilityState={{ selected: active === 'home' }}
        onPress={() => router.replace('/stores')}
        style={styles.item}
      >
        <SymbolView
          name={{ ios: 'house', android: 'home', web: 'home' }}
          size={19}
          tintColor={
            active === 'home' ? colors.surface.selected : colors.border.default
          }
        />
        <Text style={[styles.label, active === 'home' && styles.activeLabel]}>
          Início
        </Text>
      </Pressable>
      <View
        style={styles.item}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <SymbolView
          name={{
            ios: 'shippingbox',
            android: 'inventory_2',
            web: 'inventory_2',
          }}
          size={19}
          tintColor={colors.border.default}
        />
        <Text style={styles.label}>Estoque</Text>
      </View>
      <View
        style={styles.item}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.featuredIcon}>
          <SymbolView
            name={{ ios: 'plus', android: 'calculate', web: 'calculate' }}
            size={19}
            tintColor={colors.text.inverse}
          />
        </View>
        <Text style={styles.label}>Precificar</Text>
      </View>
      <View
        style={styles.item}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <SymbolView
          name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
          size={19}
          tintColor={colors.border.default}
        />
        <Text style={styles.label}>Relatórios</Text>
      </View>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel="Perfil"
        accessibilityState={{ selected: active === 'profile' }}
        onPress={() => router.replace('/profile')}
        style={styles.item}
      >
        <View style={active === 'profile' && styles.profileIcon}>
          <SymbolView
            name={{ ios: 'person', android: 'person', web: 'person' }}
            size={19}
            tintColor={colors.surface.selected}
          />
        </View>
        <Text
          style={[styles.label, active === 'profile' && styles.activeLabel]}
        >
          Perfil
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    width: '96%',
    maxWidth: 440,
    alignSelf: 'center',
    marginBottom: 5,
    borderRadius: 19,
    backgroundColor: colors.text.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  compactBar: { width: '98%' },
  item: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 8,
    lineHeight: 11,
    color: colors.border.default,
  },
  activeLabel: {
    color: colors.surface.selected,
    fontFamily: fontFamilies.sansSemiBold,
  },
  featuredIcon: {
    width: 34,
    height: 34,
    marginTop: -17,
    borderRadius: 17,
    backgroundColor: colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
