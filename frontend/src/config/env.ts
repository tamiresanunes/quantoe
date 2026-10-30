// Variáveis EXPO_PUBLIC_* são incorporadas ao aplicativo; nunca guardar segredos nelas.
export const appConfig = {
  dataSource: process.env.EXPO_PUBLIC_DATA_SOURCE ?? 'mock',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
} as const;
