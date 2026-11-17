import AsyncStorage from '@react-native-async-storage/async-storage';

import { mockStores } from '@/mocks/fixtures/stores';
import { mockStorePieces } from '@/mocks/fixtures/store-pieces';
import { citiesByState, states } from '@/features/stores/brazil-locations';
import { pieceDraftKey } from '@/features/inventory/piece-draft';
import {
  isPieceCondition,
  isPieceStyle,
} from '@/features/inventory/piece-attributes';
import {
  defaultStockPreferences,
  isValidStockPreferences,
  type StockPreferences,
} from '@/features/stores/stock-preferences';
import type {
  CreatePieceInput,
  CreateStoreInput,
  PricingPieceInput,
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
  if (!input.name.trim() || input.name.trim().length > 80)
    throw new Error('Informe o nome da peça com até 80 caracteres.');
  if (!input.categoryId) throw new Error('Selecione uma categoria.');
  if (!input.brandId) throw new Error('Selecione uma marca.');
  if (!isPieceCondition(input.condition))
    throw new Error('Selecione um estado de conservação válido.');
  if (!isPieceStyle(input.style))
    throw new Error('Selecione um estilo válido.');
  if (!['available', 'reserved', 'clearance', 'sold'].includes(input.status))
    throw new Error('Selecione um status válido.');
  if (
    !Number.isFinite(input.acquisitionPrice) ||
    input.acquisitionPrice < 0 ||
    input.acquisitionPrice > 1_000_000_000
  )
    throw new Error('Informe um preço de aquisição válido.');
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > 999_999
  )
    throw new Error('Informe uma quantidade válida.');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.acquisitionDate);
  const date =
    match && new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    !match ||
    !date ||
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() + 1 !== Number(match[2]) ||
    date.getDate() !== Number(match[3])
  )
    throw new Error('Informe uma data de aquisição válida.');
  if (
    input.size.length > 20 ||
    input.acquisitionPlace.length > 100 ||
    input.collection.length > 80 ||
    input.notes.length > 500
  )
    throw new Error('Confira o tamanho dos campos da peça.');
}

function validatePricing(input: PricingPieceInput) {
  if (!input.brandId) throw new Error('Selecione uma marca.');
  if (!isPieceCondition(input.condition))
    throw new Error('Selecione um estado de conservação válido.');
  if (!isPieceStyle(input.style))
    throw new Error('Selecione um estilo válido.');
  if (!Number.isFinite(input.acquisitionPrice) || input.acquisitionPrice < 0)
    throw new Error('Informe um valor de aquisição válido.');
  if (!Number.isFinite(input.salePrice) || input.salePrice <= 0)
    throw new Error('Informe um preço de venda válido.');
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
            (await readStoredPieces(ownerId, store.id)).filter(
              (piece) =>
                !mockStorePieces.some((sample) => sample.id === piece.id),
            ).length,
        })),
    );
  },
  async listPieces(ownerId, storeId) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    const saved = await readStoredPieces(ownerId, storeId);
    return [
      ...mockStorePieces.filter(
        (piece) =>
          piece.storeId === storeId &&
          !saved.some((override) => override.id === piece.id),
      ),
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
  async createQuickPiece(ownerId, storeId, name, input) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    if (!name.trim() || name.trim().length > 80)
      throw new Error('Informe o nome da peça com até 80 caracteres.');
    validatePricing(input);
    const saved = await readStoredPieces(ownerId, storeId);
    const sequence = (await readSequence(ownerId)) + 1;
    const piece: StorePiece = {
      id: `piece-${ownerId}-${sequence}`,
      storeId,
      categoryId: '',
      name: name.trim(),
      code: formatPieceCode(sequence),
      brandId: input.brandId,
      condition: input.condition,
      style: input.style,
      acquisitionPrice: input.acquisitionPrice,
    };
    try {
      await AsyncStorage.setItem(sequenceKey(ownerId), String(sequence));
      await AsyncStorage.setItem(
        pieceKey(ownerId, storeId),
        JSON.stringify([...saved, piece]),
      );
    } catch {
      throw new Error('Não foi possível cadastrar a peça avulsa.');
    }
    return { ...piece };
  },
  async pricePiece(ownerId, storeId, pieceId, input) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    validatePricing(input);
    const saved = await readStoredPieces(ownerId, storeId);
    const sampleIndex = mockStorePieces.findIndex(
      (piece) => piece.storeId === storeId && piece.id === pieceId,
    );
    const previous =
      saved.find((piece) => piece.id === pieceId) ??
      mockStorePieces[sampleIndex];
    if (!previous) throw new Error('Peça não encontrada nesta loja.');
    const updated: StorePiece = {
      ...previous,
      ...input,
      code: previous.code ?? formatPieceCode(sampleIndex + 1),
    };
    const next = saved.some((piece) => piece.id === pieceId)
      ? saved.map((piece) => (piece.id === pieceId ? updated : piece))
      : [...saved, updated];
    try {
      await AsyncStorage.setItem(
        pieceKey(ownerId, storeId),
        JSON.stringify(next),
      );
    } catch {
      throw new Error('Não foi possível salvar o preço da peça.');
    }
    return { ...updated };
  },
  async updatePiece(ownerId, storeId, pieceId, input) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    validatePiece(input);
    const saved = await readStoredPieces(ownerId, storeId);
    const sampleIndex = mockStorePieces.findIndex(
      (piece) => piece.storeId === storeId && piece.id === pieceId,
    );
    const previous =
      saved.find((piece) => piece.id === pieceId) ??
      mockStorePieces[sampleIndex];
    if (!previous || previous.storeId !== storeId)
      throw new Error('Peça não encontrada nesta loja.');
    const updated: StorePiece = {
      ...previous,
      ...input,
      id: pieceId,
      storeId,
      code: previous.code ?? formatPieceCode(sampleIndex + 1),
      name: input.name.trim(),
    };
    const next = saved.some((piece) => piece.id === pieceId)
      ? saved.map((piece) => (piece.id === pieceId ? updated : piece))
      : [...saved, updated];
    try {
      await AsyncStorage.setItem(
        pieceKey(ownerId, storeId),
        JSON.stringify(next),
      );
    } catch {
      throw new Error('Não foi possível salvar as alterações da peça.');
    }
    return { ...updated };
  },
  async setPiecePrice(ownerId, storeId, pieceId, salePrice) {
    await requireOwner(ownerId);
    requireStore(ownerId, storeId);
    if (!Number.isFinite(salePrice) || salePrice < 0)
      throw new Error('Informe um preço de venda válido.');
    const saved = await readStoredPieces(ownerId, storeId);
    const sampleIndex = mockStorePieces.findIndex(
      (piece) => piece.storeId === storeId && piece.id === pieceId,
    );
    const target =
      saved.find((piece) => piece.id === pieceId) ??
      mockStorePieces[sampleIndex];
    if (!target) throw new Error('Peça não encontrada.');
    if (
      !target.name.trim() ||
      !target.categoryId ||
      !target.brandId ||
      !isPieceCondition(target.condition) ||
      !isPieceStyle(target.style) ||
      !target.status ||
      target.acquisitionPrice === undefined ||
      !Number.isFinite(target.acquisitionPrice) ||
      target.acquisitionPrice < 0 ||
      !target.quantity ||
      !Number.isInteger(target.quantity) ||
      target.quantity < 1 ||
      !target.acquisitionDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(target.acquisitionDate)
    )
      throw new Error(
        'Complete os dados obrigatórios da peça antes de precificar.',
      );
    const updated = {
      ...target,
      code: target.code ?? formatPieceCode(sampleIndex + 1),
      salePrice,
    };
    try {
      await AsyncStorage.setItem(
        pieceKey(ownerId, storeId),
        JSON.stringify(
          saved.some((piece) => piece.id === pieceId)
            ? saved.map((piece) => (piece.id === pieceId ? updated : piece))
            : [...saved, updated],
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
    await AsyncStorage.removeItem(pieceDraftKey(ownerId, storeId));
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
