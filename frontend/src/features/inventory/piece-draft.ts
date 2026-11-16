import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PieceCondition, PieceStatus, PieceStyle } from '@/types/models';

export type PieceDraft = {
  photoUri: string | null;
  name: string;
  size: string;
  categoryId: string;
  brandId: string;
  condition: PieceCondition;
  style: PieceStyle;
  acquisitionPrice: string;
  quantity: string;
  acquisitionPlace: string;
  acquisitionDate: string;
  collection: string;
  notes: string;
  status: PieceStatus;
};

export function pieceDraftKey(ownerId: string, storeId: string) {
  return `@quantoe/piece-draft/v1/${encodeURIComponent(ownerId)}/${encodeURIComponent(storeId)}`;
}

function isPieceDraft(value: unknown): value is PieceDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  return (
    (draft.photoUri === null || typeof draft.photoUri === 'string') &&
    [
      'name',
      'size',
      'categoryId',
      'brandId',
      'acquisitionPrice',
      'quantity',
      'acquisitionPlace',
      'acquisitionDate',
      'collection',
      'notes',
    ].every((field) => typeof draft[field] === 'string') &&
    ['new', 'excellent', 'good', 'fair', 'worn'].includes(
      String(draft.condition),
    ) &&
    ['casual', 'social', 'vintage', 'beach', 'winter', 'other'].includes(
      String(draft.style),
    ) &&
    ['available', 'reserved', 'clearance', 'sold'].includes(
      String(draft.status),
    )
  );
}

export async function readPieceDraft(key: string): Promise<PieceDraft | null> {
  const stored = await AsyncStorage.getItem(key);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    return isPieceDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePieceDraft(key: string, draft: PieceDraft) {
  return AsyncStorage.setItem(key, JSON.stringify(draft));
}

export function removePieceDraft(key: string) {
  return AsyncStorage.removeItem(key);
}
