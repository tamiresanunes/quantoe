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
