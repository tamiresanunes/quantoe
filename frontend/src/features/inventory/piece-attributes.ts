import type { PieceCondition, PieceStyle } from '@/types/models';

export const conditions: readonly {
  value: PieceCondition;
  label: string;
  points: number;
}[] = [
  { value: 'new_with_tag', label: 'Novo com etiqueta', points: 35 },
  { value: 'excellent', label: 'Excelente', points: 30 },
  { value: 'very_good', label: 'Muito bom', points: 25 },
  { value: 'good', label: 'Bom', points: 20 },
  { value: 'fair', label: 'Regular', points: 10 },
];

export const stylesList: readonly {
  value: PieceStyle;
  label: string;
  points: number;
}[] = [
  { value: 'vintage', label: 'Vintage', points: 20 },
  { value: 'old_money', label: 'Old Money', points: 20 },
  { value: 'y2k', label: 'Y2K', points: 18 },
  { value: 'retro', label: 'Retrô', points: 15 },
  { value: 'streetwear', label: 'Streetwear', points: 15 },
  { value: 'cottagecore', label: 'Cottagecore', points: 15 },
  { value: 'boho', label: 'Boho', points: 12 },
  { value: 'classic', label: 'Clássico', points: 12 },
  { value: 'minimalist', label: 'Minimalista', points: 10 },
  { value: 'sporty', label: 'Esportivo', points: 10 },
  { value: 'social', label: 'Social', points: 10 },
  { value: 'casual', label: 'Casual', points: 8 },
];

export const conditionLabels = Object.fromEntries(
  conditions.map(({ value, label }) => [value, label]),
) as Record<PieceCondition, string>;

export const styleLabels = Object.fromEntries(
  stylesList.map(({ value, label }) => [value, label]),
) as Record<PieceStyle, string>;

export function isPieceCondition(value: unknown): value is PieceCondition {
  return conditions.some((item) => item.value === value);
}

export function isPieceStyle(value: unknown): value is PieceStyle {
  return stylesList.some((item) => item.value === value);
}
