import type { StorePiece } from '@/types/models';

/** Amostras de estoque separadas por loja para o fluxo de demonstração. */
export const mockStorePieces: readonly StorePiece[] = [
  {
    id: 'piece-01',
    storeId: 'store-01',
    categoryId: 'vestidos',
    name: 'Vestido floral',
  },
  {
    id: 'piece-02',
    storeId: 'store-01',
    categoryId: 'casacos',
    name: 'Jaqueta jeans',
  },
  {
    id: 'piece-03',
    storeId: 'store-02',
    categoryId: 'camisas',
    name: 'Camisa de linho',
  },
  {
    id: 'piece-04',
    storeId: 'store-02',
    categoryId: 'acessorios',
    name: 'Bolsa vintage',
  },
  {
    id: 'piece-05',
    storeId: 'store-03',
    categoryId: 'saias',
    name: 'Saia midi',
  },
];
