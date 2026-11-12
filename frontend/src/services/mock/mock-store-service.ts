import AsyncStorage from '@react-native-async-storage/async-storage';

import { mockStores } from '@/mocks/fixtures/stores';
import { mockStorePieces } from '@/mocks/fixtures/store-pieces';
import { citiesByState, states } from '@/features/stores/brazil-locations';
import {
  defaultStockPreferences,
  isValidStockPreferences,
  type StockPreferences,
} from '@/features/stores/stock-preferences';
import type {
  CreateStoreInput,
  StoreService,
} from '@/services/contracts/store-service';
import { mockAuthService } from '@/services/mock/mock-auth-service';
import type { Store } from '@/types/models';

const stores: Store[] = mockStores.map((store) => ({ ...store }));

function preferenceKey(ownerId: string, storeId: string) {
  return `@quantoe/stock-preferences/v1/${encodeURIComponent(ownerId)}/${encodeURIComponent(storeId)}`;
}

function clonePreferences(preferences: StockPreferences): StockPreferences {
  return {
    ...preferences,
    minimumByCategory: { ...preferences.minimumByCategory },
  };
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
    await AsyncStorage.removeItem(preferenceKey(ownerId, storeId));
    const index = stores.indexOf(store);
    stores.splice(index, 1);
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
    let stored: string | null;
    try {
      stored = await AsyncStorage.getItem(preferenceKey(ownerId, storeId));
    } catch {
      throw new Error('Não foi possível carregar as preferências salvas.');
    }
    if (stored === null) return defaultStockPreferences();
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      throw new Error('As preferências salvas estão inválidas.');
    }
    if (!isValidStockPreferences(parsed))
      throw new Error('As preferências salvas estão inválidas.');
    return clonePreferences(parsed);
  },
  async saveStockPreferences(ownerId, storeId, preferences) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    if (!isValidStockPreferences(preferences)) {
      throw new Error('Confira os valores das regras de estoque.');
    }
    const saved = clonePreferences(preferences);
    try {
      await AsyncStorage.setItem(
        preferenceKey(ownerId, storeId),
        JSON.stringify(saved),
      );
    } catch {
      throw new Error(
        'Não foi possível salvar as preferências neste dispositivo.',
      );
    }
    return clonePreferences(saved);
  },
};
