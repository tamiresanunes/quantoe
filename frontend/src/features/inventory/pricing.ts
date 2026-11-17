import { brandTiers, type BrandTier } from '@/features/brands/brand-types';
import { conditions, stylesList } from '@/features/inventory/piece-attributes';
import type { PieceCondition, PieceStyle } from '@/types/models';

export function calculatePricing(
  acquisitionPrice: number,
  brandTier: BrandTier,
  condition: PieceCondition,
  style: PieceStyle,
) {
  if (!Number.isFinite(acquisitionPrice) || acquisitionPrice < 0)
    throw new Error('Preço de aquisição inválido.');
  const brandPoints = brandTiers.find((item) => item.id === brandTier)?.points;
  const conditionPoints = conditions.find(
    (item) => item.value === condition,
  )?.points;
  const stylePoints = stylesList.find((item) => item.value === style)?.points;
  if (
    brandPoints === undefined ||
    conditionPoints === undefined ||
    stylePoints === undefined
  )
    throw new Error('Dados de valorização inválidos.');
  const score = brandPoints + conditionPoints + stylePoints;
  const percent =
    score >= 100
      ? 180
      : score >= 80
        ? 140
        : score >= 60
          ? 100
          : score >= 40
            ? 70
            : 40;
  const suggestedPrice =
    Math.round(acquisitionPrice * 100 * (1 + percent / 100)) / 100;
  return {
    brandPoints,
    conditionPoints,
    stylePoints,
    score,
    percent,
    suggestedPrice,
  };
}
