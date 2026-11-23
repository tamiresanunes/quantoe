import type { Category, StorePiece } from '@/types/models';

export type CategoryIndicator = {
  id: string;
  name: string;
  quantity: number;
  potentialSale: number;
};

export function calculateInventoryIndicators(
  pieces: readonly StorePiece[],
  categories: readonly Category[],
) {
  const active = pieces.filter(
    (piece) =>
      piece.status !== 'sold' &&
      Number.isInteger(piece.quantity) &&
      (piece.quantity ?? 0) > 0,
  );
  const byCategory = new Map<string, CategoryIndicator>();
  let totalPieces = 0;
  let invested = 0;
  let potentialSale = 0;
  let potentialProfit = 0;
  let pricedPieces = 0;

  for (const piece of active) {
    const quantity = piece.quantity ?? 0;
    const cost = piece.acquisitionPrice;
    const sale = piece.salePrice;
    const hasCost = cost !== undefined && Number.isFinite(cost) && cost >= 0;
    const hasSale = sale !== undefined && Number.isFinite(sale) && sale >= 0;
    const category = categories.find((item) => item.id === piece.categoryId);
    const key = category?.id ?? '__uncategorized';
    const current = byCategory.get(key) ?? {
      id: key,
      name: category?.name ?? 'Sem categoria',
      quantity: 0,
      potentialSale: 0,
    };

    totalPieces += quantity;
    current.quantity += quantity;
    if (hasCost) invested += cost * quantity;
    if (hasSale) {
      potentialSale += sale * quantity;
      current.potentialSale += sale * quantity;
    }
    if (hasCost && hasSale) {
      potentialProfit += (sale - cost) * quantity;
      pricedPieces += quantity;
    }
    byCategory.set(key, current);
  }

  return {
    totalPieces,
    listingCount: active.length,
    invested,
    potentialSale,
    potentialProfit,
    pricedPieces,
    byCategory: [...byCategory.values()].sort(
      (a, b) =>
        b.quantity - a.quantity || a.name.localeCompare(b.name, 'pt-BR'),
    ),
  };
}
