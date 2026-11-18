import {
  defaultStockPreferences,
  stockCategories,
  type StockCategory,
  type StockPreferences,
} from '@/features/stores/stock-preferences';
import type { Category, StorePiece } from '@/types/models';

export type StockAlert = 'exhausted' | 'low' | null;

export function minimumStockForCategory(
  category: Category,
  preferences: StockPreferences = defaultStockPreferences(),
) {
  if (stockCategories.some((name) => name === category.name)) {
    return preferences.minimumByCategory[category.name as StockCategory];
  }
  return category.minimumStock ?? preferences.defaultMinimum;
}

export function minimumStockForPiece(
  piece: StorePiece,
  categories: readonly Category[],
  preferences: StockPreferences = defaultStockPreferences(),
) {
  const category = categories.find((item) => item.id === piece.categoryId);
  return category
    ? minimumStockForCategory(category, preferences)
    : preferences.defaultMinimum;
}

export function stockAlertForPiece(
  piece: StorePiece,
  categories: readonly Category[],
  preferences?: StockPreferences,
): StockAlert {
  if (piece.quantity === 0 || piece.status === 'sold') return 'exhausted';
  if (
    piece.quantity !== undefined &&
    piece.quantity <= minimumStockForPiece(piece, categories, preferences)
  )
    return 'low';
  return null;
}
