/** Paleta de referência. Use os tokens semânticos abaixo nas interfaces. */
export const palette = {
  terracotta: '#A6533D',
  clay: '#D18A6A',
  cream: '#F5EDE2',
  olive: '#6B7054',
  coffee: '#332A25',
  white: '#FFFFFF',
} as const;

const semanticColors = {
  success: { foreground: '#426B50', background: '#E7F1E8' },
  warning: { foreground: '#926017', background: '#FFF2D7' },
  error: { foreground: '#A13F3A', background: '#FBE8E5' },
  info: { foreground: '#456B7B', background: '#E7F0F3' },
} as const;

/** Tema claro do QuantoÉ. */
export const colors = {
  brand: palette,
  background: {
    primary: '#FAF6EF',
    secondary: palette.cream,
  },
  surface: {
    primary: '#FFFCF8',
    selected: '#F5E4DD',
  },
  border: {
    default: '#D9CABE',
    strong: '#806F63',
    selected: palette.terracotta,
  },
  text: {
    primary: palette.coffee,
    secondary: '#62534A',
    auxiliary: '#806F63',
    inverse: palette.white,
  },
  action: {
    primary: '#914631',
    primaryPressed: '#783A2B',
    secondary: '#914631',
  },
  semantic: semanticColors,
  pieceStatus: {
    available: { foreground: '#62534A', background: palette.cream },
    reserved: semanticColors.info,
    clearance: semanticColors.warning,
    sold: semanticColors.success,
  },
} as const;
