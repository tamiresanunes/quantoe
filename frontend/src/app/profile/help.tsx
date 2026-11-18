import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { useResponsiveLayout } from '@/theme/responsive';
import { fontFamilies } from '@/theme/typography';

const questions = [
  {
    title: 'Como o preço sugerido é calculado?',
    answer:
      'O sistema combina o valor de aquisição com as pontuações da marca, do estado de conservação e do estilo. Você pode ajustar o preço final antes de confirmar.',
  },
  {
    title: 'Posso precificar sem cadastrar a peça?',
    answer:
      'Sim. Em Precificar, escolha Peça avulsa e informe o nome. Ela é cadastrada automaticamente com os dados disponíveis; você pode completar o cadastro depois.',
  },
  {
    title: 'Como funcionam os alertas de estoque?',
    answer:
      'As categorias aparecem quando a quantidade disponível fica abaixo do mínimo configurado. Peças paradas são identificadas pelos dias desde a aquisição e pelo limite definido nas preferências de estoque.',
  },
  {
    title: 'Consigo ter mais de uma loja?',
    answer:
      'Sim. Cadastre outras lojas em Minhas lojas e selecione qual delas está ativa para consultar o estoque e os alertas.',
  },
] as const;

export default function HelpScreen() {
  const { contentWidth } = useResponsiveLayout();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.heroBackdrop} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={[s.inner, { width: contentWidth }]}>
          <View style={s.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar para configurações"
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace('/profile/settings')
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
              Ajuda
            </Text>
          </View>

          <View style={s.faqCard}>
            {questions.map((question, index) => {
              const isExpanded = expanded === index;
              return (
                <View key={question.title} style={index > 0 && s.divider}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={question.title}
                    accessibilityState={{ expanded: isExpanded }}
                    onPress={() => setExpanded(isExpanded ? null : index)}
                    style={s.questionRow}
                  >
                    <Text style={s.questionText}>{question.title}</Text>
                    <SymbolView
                      name={{
                        ios: isExpanded ? 'chevron.up' : 'chevron.down',
                        android: isExpanded
                          ? 'keyboard_arrow_up'
                          : 'keyboard_arrow_down',
                        web: isExpanded
                          ? 'keyboard_arrow_up'
                          : 'keyboard_arrow_down',
                      }}
                      size={14}
                      tintColor={colors.text.secondary}
                    />
                  </Pressable>
                  {isExpanded ? (
                    <Text style={s.answer}>{question.answer}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={s.supportCard}>
            <SymbolView
              name={{
                ios: 'bubble.left',
                android: 'chat_bubble_outline',
                web: 'chat_bubble_outline',
              }}
              size={20}
              tintColor={colors.action.primary}
            />
            <Text style={s.supportTitle}>Ainda com dúvidas?</Text>
            <Text style={s.supportMessage}>
              Canal de suporte ainda não disponível.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Falar com o suporte"
              accessibilityState={{ disabled: true }}
              disabled
              style={s.supportButton}
            >
              <Text style={s.supportButtonText}>Falar com o suporte</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
    height: 292,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: colors.surface.selected,
  },
  content: { alignItems: 'center', flexGrow: 1, paddingBottom: 32 },
  inner: { maxWidth: 420, gap: 13, paddingTop: 11 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 15,
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
  faqCard: {
    borderRadius: 18,
    paddingHorizontal: 8,
    backgroundColor: colors.surface.primary,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.08,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border.default },
  questionRow: {
    minHeight: 39,
    paddingHorizontal: 5,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  questionText: {
    flex: 1,
    fontFamily: fontFamilies.display,
    fontSize: 11,
    color: colors.text.primary,
  },
  answer: {
    paddingHorizontal: 5,
    paddingBottom: 12,
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.text.secondary,
  },
  supportCard: {
    alignItems: 'center',
    gap: 5,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.selected,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  supportTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 16,
    color: colors.text.primary,
  },
  supportMessage: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 10,
    color: colors.text.secondary,
  },
  supportButton: {
    width: '100%',
    height: 36,
    marginTop: 5,
    borderRadius: 12,
    backgroundColor: colors.action.primary,
    opacity: 0.55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    color: colors.text.inverse,
  },
});
