import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppFeedback } from '@/components/app-feedback';
import { AppTextField } from '@/components/app-text-field';
import {
  categoryColors,
  categoryIcons,
} from '@/features/categories/category-options';
import { useAuth } from '@/features/auth/auth-context';
import { mockCategoryService } from '@/services/mock/mock-category-service';
import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';
import type { CategoryIcon } from '@/types/models';

export default function NewCategoryScreen() {
  const { user } = useAuth();
  const { compact, heroHeight, contentWidth, cardPadding } =
    useResponsiveLayout();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<CategoryIcon>('clothing');
  const [color, setColor] = useState<string>(categoryColors[0].value);
  const [minimumStock, setMinimumStock] = useState('2');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIcon =
    categoryIcons.find((item) => item.value === icon) ?? categoryIcons[0];
  const validMinimum =
    /^\d+$/.test(minimumStock.trim()) && Number(minimumStock.trim()) <= 999;

  async function save() {
    if (!user || saving) return;
    setSubmitted(true);
    setError(null);
    if (!name.trim() || !validMinimum) {
      setError('Confira o nome e o estoque mínimo antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      await mockCategoryService.create(user.id, {
        name,
        icon,
        color,
        minimumStock: Number(minimumStock.trim()),
        description,
      });
      router.replace({
        pathname: '/profile/categories',
        params: { created: '1' },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, { height: heroHeight }]}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar para categorias"
                onPress={() => router.replace('/profile/categories')}
                style={styles.backButton}
              >
                <SymbolView
                  name={{
                    ios: 'chevron.left',
                    android: 'arrow_back',
                    web: 'arrow_back',
                  }}
                  size={17}
                  tintColor={colors.action.secondary}
                />
              </Pressable>
              <View style={styles.headerText}>
                <Text accessibilityRole="header" style={styles.title}>
                  Nova categoria
                </Text>
                <Text style={styles.kicker}>Cadastro</Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                width: contentWidth,
                padding: cardPadding,
                marginTop: (compact ? 100 : 104) - heroHeight,
              },
            ]}
          >
            <View style={styles.preview}>
              <View style={[styles.previewIcon, { backgroundColor: color }]}>
                <SymbolView
                  name={selectedIcon.symbol}
                  size={24}
                  tintColor={colors.text.inverse}
                />
              </View>
              <View style={styles.previewCopy}>
                <Text numberOfLines={1} style={styles.previewName}>
                  {name.trim() || 'Nome da categoria'}
                </Text>
                <Text style={styles.previewHint}>
                  Prévia de como ela aparece no app
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <AppTextField
              label="Nome da categoria"
              placeholder="Ex.: Vestidos"
              value={name}
              onChangeText={setName}
              maxLength={40}
              autoCapitalize="sentences"
              returnKeyType="next"
              error={
                submitted && !name.trim()
                  ? 'Informe o nome da categoria.'
                  : undefined
              }
            />

            <View style={styles.section}>
              <Text style={styles.label}>Ícone</Text>
              <View style={styles.choices}>
                {categoryIcons.map((item) => (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityLabel={`Ícone ${item.label}`}
                    accessibilityState={{ selected: icon === item.value }}
                    onPress={() => setIcon(item.value)}
                    style={[
                      styles.iconChoice,
                      icon === item.value && styles.iconChoiceSelected,
                    ]}
                  >
                    <SymbolView
                      name={item.symbol}
                      size={19}
                      tintColor={
                        icon === item.value
                          ? colors.action.secondary
                          : colors.text.secondary
                      }
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Cor de identificação</Text>
              <View style={styles.choices}>
                {categoryColors.map((item) => (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityLabel={`Cor ${item.label}`}
                    accessibilityState={{ selected: color === item.value }}
                    onPress={() => setColor(item.value)}
                    style={[
                      styles.colorChoice,
                      color === item.value && styles.colorChoiceSelected,
                      { backgroundColor: item.value },
                    ]}
                  >
                    {color === item.value ? (
                      <SymbolView
                        name={{
                          ios: 'checkmark',
                          android: 'check',
                          web: 'check',
                        }}
                        size={15}
                        tintColor={colors.text.inverse}
                      />
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>

            <AppTextField
              label="Estoque mínimo padrão"
              value={minimumStock}
              onChangeText={setMinimumStock}
              keyboardType="number-pad"
              maxLength={10}
              helperText="Avisa quando a categoria ficar abaixo deste total"
              error={
                submitted && !validMinimum
                  ? 'Informe um número inteiro de 0 a 999.'
                  : undefined
              }
            />

            <AppTextField
              label="Descrição"
              placeholder="Ex.: vestidos curtos, midi e longos"
              value={description}
              onChangeText={setDescription}
              maxLength={200}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              fieldStyle={styles.descriptionField}
              style={styles.descriptionInput}
              helperText="Opcional"
            />

            {error ? (
              <AppFeedback
                compact
                variant="error"
                title="Não foi possível salvar"
                message={error}
                onDismiss={() => setError(null)}
              />
            ) : null}

            <View style={styles.actions}>
              <AppButton
                title="Salvar categoria"
                loading={saving}
                onPress={save}
              />
              <AppButton
                title="Cancelar"
                variant="secondary"
                disabled={saving}
                onPress={() => router.replace('/profile/categories')}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 32 },
  hero: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 11,
    backgroundColor: colors.surface.selected,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.primary,
  },
  kicker: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.action.secondary,
  },
  card: {
    maxWidth: 420,
    gap: 16,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: { flex: 1, minWidth: 0 },
  previewName: {
    fontFamily: fontFamilies.display,
    fontSize: 16,
    color: colors.text.primary,
  },
  previewHint: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  separator: { height: 1, backgroundColor: colors.border.default },
  section: { gap: 9 },
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    color: colors.text.primary,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  iconChoice: {
    width: 39,
    height: 39,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceSelected: {
    borderColor: colors.action.secondary,
    backgroundColor: colors.surface.selected,
  },
  colorChoice: {
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChoiceSelected: {
    borderWidth: 2,
    borderColor: colors.surface.primary,
    outlineWidth: 1,
    outlineColor: colors.action.secondary,
  },
  descriptionField: { minHeight: 75, alignItems: 'flex-start' },
  descriptionInput: { minHeight: 71, paddingTop: 10 },
  actions: { gap: 9 },
});
