import type { Store } from '@/types/models';

export const mockStores: readonly Store[] = [
  {
    id: 'store-01',
    ownerId: 'user-01',
    name: 'Garimpo da Ana',
    logoUrl: null,
    city: 'Rio de Janeiro',
    state: 'RJ',
    pieceCount: 42,
    isActive: true,
  },
  {
    id: 'store-02',
    ownerId: 'user-01',
    name: 'Garimpo Online',
    logoUrl: null,
    city: 'Niterói',
    state: 'RJ',
    pieceCount: 38,
    isActive: false,
  },
  {
    id: 'store-03',
    ownerId: 'user-02',
    name: 'Brechó da Bruna',
    logoUrl: null,
    city: 'São Paulo',
    state: 'SP',
    pieceCount: 11,
    isActive: true,
  },
];
