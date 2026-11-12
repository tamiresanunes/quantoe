import type { ID, Store, StorePiece } from '@/types/models';
import type { StockPreferences } from '@/features/stores/stock-preferences';

export interface CreateStoreInput {
  ownerId: ID;
  name: string;
  logoUrl?: string | null;
  city: string;
  state: string;
}

export interface StoreService {
  listByOwner(ownerId: ID): Promise<Store[]>;
  listPieces(ownerId: ID, storeId: ID): Promise<StorePiece[]>;
  create(input: CreateStoreInput): Promise<Store>;
  update(
    ownerId: ID,
    storeId: ID,
    input: Omit<CreateStoreInput, 'ownerId'>,
  ): Promise<Store>;
  remove(ownerId: ID, storeId: ID): Promise<void>;
  setActive(ownerId: ID, storeId: ID): Promise<Store>;
  getStockPreferences(ownerId: ID, storeId: ID): Promise<StockPreferences>;
  saveStockPreferences(
    ownerId: ID,
    storeId: ID,
    preferences: StockPreferences,
  ): Promise<StockPreferences>;
}
