import type { StorePiece } from '@/types/models';

/** Amostras de estoque separadas por loja para o fluxo de demonstração. */
export const mockStorePieces: readonly StorePiece[] = [
  { id: 'piece-01', storeId: 'store-01', name: 'Vestido floral' },
  { id: 'piece-02', storeId: 'store-01', name: 'Jaqueta jeans' },
  { id: 'piece-03', storeId: 'store-02', name: 'Camisa de linho' },
  { id: 'piece-04', storeId: 'store-02', name: 'Bolsa vintage' },
  { id: 'piece-05', storeId: 'store-03', name: 'Saia midi' },
];
