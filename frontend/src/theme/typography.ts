import { StyleSheet } from 'react-native';

export const fontFamilies = {
  display: 'DMSerifDisplay_400Regular',
  sansRegular: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
} as const;

/** Tamanhos em sp; Text e TextInput mantêm o dimensionamento do sistema. */
export const fontSizes = {
  display: 36,
  h1: 30,
  h2: 26,
  h3: 22,
  subtitle: 18,
  body: 16,
  bodySecondary: 14,
  label: 14,
  caption: 12,
  button: 16,
} as const;

export const textStyles = StyleSheet.create({
  display: { fontFamily: fontFamilies.display, fontSize: fontSizes.display },
  h1: { fontFamily: fontFamilies.display, fontSize: fontSizes.h1 },
  h2: { fontFamily: fontFamilies.display, fontSize: fontSizes.h2 },
  h3: { fontFamily: fontFamilies.sansSemiBold, fontSize: fontSizes.h3 },
  subtitle: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: fontSizes.subtitle,
  },
  body: { fontFamily: fontFamilies.sansRegular, fontSize: fontSizes.body },
  bodySecondary: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: fontSizes.bodySecondary,
  },
  label: { fontFamily: fontFamilies.sansMedium, fontSize: fontSizes.label },
  caption: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: fontSizes.caption,
  },
  button: { fontFamily: fontFamilies.sansSemiBold, fontSize: fontSizes.button },
});
