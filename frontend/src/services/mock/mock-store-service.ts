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
  CreatePieceInput,
  CreateStoreInput,
  StoreService,
} from '@/services/contracts/store-service';
import { mockAuthService } from '@/services/mock/mock-auth-service';
import type { Store, StorePiece } from '@/types/models';

const stores: Store[] = mockStores.map((store) => ({ ...store }));

function preferenceKey(ownerId: string, storeId: string) {
  return `@quantoe/stock-preferences/v1/${encodeURIComponent(ownerId)}/${encodeURIComponent(storeId)}`;
}

function pieceKey(ownerId: string, storeId: string) {
  return `@quantoe/pieces/v1/${encodeURIComponent(ownerId)}/${encodeURIComponent(storeId)}`;
}

function sequenceKey(ownerId: string) {
  return `@quantoe/piece-sequence/v1/${encodeURIComponent(ownerId)}`;
}

async function readStoredPieces(
  ownerId: string,
  storeId: string,
): Promise<StorePiece[]> {
  let stored: string | null;
  try {
    stored = await AsyncStorage.getItem(pieceKey(ownerId, storeId));
  } catch {
    throw new Error('Não foi possível carregar as peças salvas.');
  }
  if (stored === null) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (piece) =>
          piece &&
          typeof piece.id === 'string' &&
          piece.storeId === storeId &&
          typeof piece.categoryId === 'string' &&
          typeof piece.name === 'string' &&
          typeof piece.code === 'string',
      )
    ) {
      return parsed;
    }
  } catch {
    // O dado local não pode ser usado.
  }
  throw new Error('As peças salvas estão inválidas.');
}

async function readSequence(ownerId: string) {
  try {
    const stored = await AsyncStorage.getItem(sequenceKey(ownerId));
    const number = stored === null ? 142 : Number(stored);
    if (Number.isInteger(number) && number >= 142) return number;
  } catch {
    throw new Error('Não foi possível gerar o código da peça.');
  }
  throw new Error('A sequência de códigos está inválida.');
}

function formatPieceCode(sequence: number) {
  return `QE-${String(sequence).padStart(4, '0')}`;
}

function validatePiece(input: CreatePieceInput) {
  if (!input.name.trim()) throw new Error('Informe o nome da peça.');
  if (!input.categoryId) throw new Error('Selecione uma categoria.');
  if (!input.brandId) throw new Error('Selecione uma marca.');
  if (!Number.isFinite(input.acquisitionPrice) || input.acquisitionPrice < 0)
    throw new Error('Informe um preço de aquisição válido.');
  if (!Number.isInteger(input.quantity) || input.quantity < 1)
    throw new Error('Informe uma quantidade válida.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.acquisitionDate))
    throw new Error('Informe uma data de aquisição válida.');
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
    return Promise.all(
      stores
        .filter((store) => store.ownerId === ownerId)
        .map(async (store) => ({
          ...store,
          pieceCount:
            store.pieceCount +
            (await readStoredPieces(ownerId, store.id)).length,
        })),
    );
  },
  async listPieces(ownerId, storeId) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    const saved = await readStoredPieces(ownerId, storeId);
    return [
      ...mockStorePieces.filter((piece) => piece.storeId === storeId),
      ...saved,
    ].map((piece) => ({ ...piece }));
  },
  async nextPieceCode(ownerId) {
    await requireOwner(ownerId);
    return formatPieceCode((await readSequence(ownerId)) + 1);
  },
  async createPiece(ownerId, storeId, input) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    validatePiece(input);
    const saved = await readStoredPieces(ownerId, storeId);
    const sequence = (await readSequence(ownerId)) + 1;
    const piece: StorePiece = {
      id: `piece-${ownerId}-${sequence}`,
      storeId,
      code: formatPieceCode(sequence),
      ...input,
      name: input.name.trim(),
    };
    try {
      await AsyncStorage.setItem(sequenceKey(ownerId), String(sequence));
      await AsyncStorage.setItem(
        pieceKey(ownerId, storeId),
        JSON.stringify([...saved, piece]),
      );
    } catch {
      throw new Error('Não foi possível salvar a peça neste dispositivo.');
    }
    return { ...piece };
  },
  async setPiecePrice(ownerId, storeId, pieceId, salePrice) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    if (!Number.isFinite(salePrice) || salePrice < 0)
      throw new Error('Informe um preço de venda válido.');
    const saved = await readStoredPieces(ownerId, storeId);
    const target = saved.find((piece) => piece.id === pieceId);
    if (!target) throw new Error('Peça não encontrada.');
    const updated = { ...target, salePrice };
    try {
      await AsyncStorage.setItem(
        pieceKey(ownerId, storeId),
        JSON.stringify(
          saved.map((piece) => (piece.id === pieceId ? updated : piece)),
        ),
      );
    } catch {
      throw new Error('Não foi possível salvar o preço da peça.');
    }
    return { ...updated };
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
    await AsyncStorage.removeItem(pieceKey(ownerId, storeId));
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
