import { mockStores } from '@/mocks/fixtures/stores';
import { mockStorePieces } from '@/mocks/fixtures/store-pieces';
import { citiesByState, states } from '@/features/stores/brazil-locations';
import {
  defaultStockPreferences,
  stockCategories,
  type StockPreferences,
} from '@/features/stores/stock-preferences';
import type {
  CreateStoreInput,
  StoreService,
} from '@/services/contracts/store-service';
import { mockAuthService } from '@/services/mock/mock-auth-service';
import type { Store } from '@/types/models';

const stores: Store[] = mockStores.map((store) => ({ ...store }));
const stockPreferences = new Map<string, StockPreferences>();

function preferenceKey(ownerId: string, storeId: string) {
  return `${ownerId}:${storeId}`;
}

function clonePreferences(preferences: StockPreferences): StockPreferences {
  return {
    ...preferences,
    minimumByCategory: { ...preferences.minimumByCategory },
  };
}

function validMinimum(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 999;
}

async function requireOwner(ownerId: string) {
  const user = await mockAuthService.getCurrentUser();
  if (user?.id !== ownerId) throw new Error('Acesso à loja não autorizado.');
}

function requireStore(ownerId: string, storeId: string) {
  const store = stores.find(
    (item) => item.id === storeId && item.ownerId === ownerId,
  );
  if (!store) throw new Error('Loja não encontrada.');
  return store;
}

function validate(input: Omit<CreateStoreInput, 'ownerId'>) {
  if (!input.name.trim()) throw new Error('Informe o nome da loja.');
  if (!states.some((state) => state.value === input.state))
    throw new Error('Selecione o estado da loja.');
  if (!(citiesByState[input.state] ?? []).includes(input.city))
    throw new Error('Selecione uma cidade válida para o estado.');
}

export const mockStoreService: StoreService = {
  async listByOwner(ownerId) {
    await requireOwner(ownerId);
    return stores
      .filter((store) => store.ownerId === ownerId)
      .map((store) => ({ ...store }));
  },
  async listPieces(ownerId, storeId) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    return mockStorePieces
      .filter((piece) => piece.storeId === storeId)
      .map((piece) => ({ ...piece }));
  },
  async create(input: CreateStoreInput) {
    await requireOwner(input.ownerId);
    validate(input);
    const store: Store = {
      id: `store-${Date.now()}`,
      ownerId: input.ownerId,
      name: input.name.trim(),
      logoUrl: input.logoUrl ?? null,
      city: input.city.trim(),
      state: input.state.trim(),
      pieceCount: 0,
      isActive: !stores.some(
        (item) => item.ownerId === input.ownerId && item.isActive,
      ),
    };
    stores.push(store);
    return { ...store };
  },
  async update(ownerId, storeId, input) {
    await requireOwner(ownerId);
    validate(input);
    const store = requireStore(ownerId, storeId);
    store.name = input.name.trim();
    store.state = input.state;
    store.city = input.city;
    store.logoUrl = input.logoUrl ?? null;
    return { ...store };
  },
  async remove(ownerId, storeId) {
    await requireOwner(ownerId);
    const store = requireStore(ownerId, storeId);
    const index = stores.indexOf(store);
    stores.splice(index, 1);
    stockPreferences.delete(preferenceKey(ownerId, storeId));
    if (store.isActive) {
      const next = stores.find((item) => item.ownerId === ownerId);
      if (next) next.isActive = true;
    }
  },
  async setActive(ownerId, storeId) {
    await requireOwner(ownerId);
    const selected = requireStore(ownerId, storeId);
    for (const store of stores) {
      if (store.ownerId === ownerId) store.isActive = store.id === storeId;
    }
    return { ...selected };
  },
  async getStockPreferences(ownerId, storeId) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    return clonePreferences(
      stockPreferences.get(preferenceKey(ownerId, storeId)) ??
        defaultStockPreferences(),
    );
  },
  async saveStockPreferences(ownerId, storeId, preferences) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    if (
      !validMinimum(preferences.defaultMinimum) ||
      stockCategories.some(
        (category) => !validMinimum(preferences.minimumByCategory[category]),
      ) ||
      !Number.isInteger(preferences.idleDays) ||
      preferences.idleDays < 1 ||
      preferences.idleDays > 3650
    ) {
      throw new Error('Confira os valores das regras de estoque.');
    }
    const saved = clonePreferences(preferences);
    stockPreferences.set(preferenceKey(ownerId, storeId), saved);
    return clonePreferences(saved);
  },
};
