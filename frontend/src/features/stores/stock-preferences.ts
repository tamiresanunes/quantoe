export const stockCategories = [
  'Casacos',
  'Vestidos',
  'Calças',
  'Camisas',
  'Acessórios',
] as const;

export type StockCategory = (typeof stockCategories)[number];

export type StockPreferences = {
  defaultMinimum: number;
  minimumByCategory: Record<StockCategory, number>;
  lowStockAlerts: boolean;
  idlePieceAlerts: boolean;
  idleDays: number;
};

export const MAX_STOCK_MINIMUM = 999;
export const MAX_IDLE_DAYS = 3650;

export function isValidStockPreferences(
  value: unknown,
): value is StockPreferences {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StockPreferences>;
  const minimumByCategory = candidate.minimumByCategory;
  const validMinimum = (number: unknown) =>
    typeof number === 'number' &&
    Number.isInteger(number) &&
    number >= 0 &&
    number <= MAX_STOCK_MINIMUM;

  return (
    validMinimum(candidate.defaultMinimum) &&
    !!minimumByCategory &&
    typeof minimumByCategory === 'object' &&
    stockCategories.every((category) =>
      validMinimum(minimumByCategory[category]),
    ) &&
    typeof candidate.lowStockAlerts === 'boolean' &&
    typeof candidate.idlePieceAlerts === 'boolean' &&
    typeof candidate.idleDays === 'number' &&
    Number.isInteger(candidate.idleDays) &&
    candidate.idleDays >= 1 &&
    candidate.idleDays <= MAX_IDLE_DAYS
  );
}

export function defaultStockPreferences(): StockPreferences {
  return {
    defaultMinimum: 2,
    minimumByCategory: {
      Casacos: 1,
      Vestidos: 2,
      Calças: 3,
      Camisas: 1,
      Acessórios: 2,
    },
    lowStockAlerts: true,
    idlePieceAlerts: true,
    idleDays: 60,
  };
}
