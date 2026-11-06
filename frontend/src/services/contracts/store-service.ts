import type { ID, Store } from '@/types/models';

export interface CreateStoreInput {
  ownerId: ID;
  name: string;
  logoUrl?: string | null;
  city: string;
  state: string;
}

export interface StoreService {
  listByOwner(ownerId: ID): Promise<Store[]>;
  create(input: CreateStoreInput): Promise<Store>;
  update(
    ownerId: ID,
    storeId: ID,
    input: Omit<CreateStoreInput, 'ownerId'>,
  ): Promise<Store>;
  remove(ownerId: ID, storeId: ID): Promise<void>;
  setActive(ownerId: ID, storeId: ID): Promise<Store>;
}
