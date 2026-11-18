import { minimumStockForCategory } from '@/features/inventory/stock-alerts';
import type { StockPreferences } from '@/features/stores/stock-preferences';
import type { Category, StorePiece } from '@/types/models';

export type IdlePieceAlert = { piece: StorePiece; days: number; limit: number };
export type LowCategoryAlert = {
  category: Category;
  quantity: number;
  minimum: number;
};

export function daysInStock(acquisitionDate: string | undefined, today: Date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(acquisitionDate ?? '');
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const days = Math.floor((todayUtc - date.getTime()) / 86_400_000);
  return days >= 0 ? days : null;
}

export function inventoryAlerts(
  pieces: readonly StorePiece[],
  categories: readonly Category[],
  preferences: StockPreferences,
  today: Date = new Date(),
) {
  const idlePieces: IdlePieceAlert[] = preferences.idlePieceAlerts
    ? pieces
        .filter((piece) => piece.status !== 'sold' && (piece.quantity ?? 0) > 0)
        .map((piece) => ({
          piece,
          days: daysInStock(piece.acquisitionDate, today),
          limit: preferences.idleDays,
        }))
        .filter(
          (item): item is IdlePieceAlert =>
            item.days !== null && item.days > item.limit,
        )
        .sort((a, b) => b.days - a.days)
    : [];

  const lowCategories: LowCategoryAlert[] = preferences.lowStockAlerts
    ? categories
        .map((category) => ({
          category,
          quantity: pieces.reduce(
            (total, piece) =>
              piece.categoryId === category.id && piece.status !== 'sold'
                ? total + Math.max(0, piece.quantity ?? 0)
                : total,
            0,
          ),
          minimum: minimumStockForCategory(category, preferences),
        }))
        .filter((item) => item.quantity < item.minimum)
        .sort((a, b) => a.quantity - a.minimum - (b.quantity - b.minimum))
    : [];

  return { idlePieces, lowCategories };
}
