import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  categoryColors,
  categoryIcons,
} from '@/features/categories/category-options';
import { mockCategories } from '@/mocks/fixtures/categories';
import { mockStorePieces } from '@/mocks/fixtures/store-pieces';
import { mockAuthService } from '@/services/mock/mock-auth-service';
import { mockStoreService } from '@/services/mock/mock-store-service';
import type { Category, CategoryIcon } from '@/types/models';

export type CreateCategoryInput = {
  name: string;
  icon: CategoryIcon;
  color: string;
  minimumStock: number;
  description: string;
};

function key(ownerId: string) {
  return `@quantoe/categories/v1/${encodeURIComponent(ownerId)}`;
}

async function requireOwner(ownerId: string) {
  const user = await mockAuthService.getCurrentUser();
  if (user?.id !== ownerId)
    throw new Error('Acesso às categorias não autorizado.');
}

function validCategories(value: unknown): value is Category[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0 &&
        (item.icon === undefined ||
          categoryIcons.some((icon) => icon.value === item.icon)) &&
        (item.color === undefined ||
          categoryColors.some((color) => color.value === item.color)) &&
        (item.minimumStock === undefined ||
          (Number.isInteger(item.minimumStock) &&
            item.minimumStock >= 0 &&
            item.minimumStock <= 999)) &&
        (item.description === undefined ||
          typeof item.description === 'string'),
    )
  );
}

async function read(ownerId: string): Promise<Category[]> {
  await requireOwner(ownerId);
  let stored: string | null;
  try {
    stored = await AsyncStorage.getItem(key(ownerId));
  } catch {
    throw new Error('Não foi possível carregar as categorias.');
  }
  if (stored === null) return mockCategories.map((item) => ({ ...item }));
  try {
    const parsed: unknown = JSON.parse(stored);
    if (validCategories(parsed)) return parsed;
  } catch {
    // O dado local não pode ser usado.
  }
  throw new Error('As categorias salvas estão inválidas.');
}

async function write(ownerId: string, categories: Category[]) {
  try {
    await AsyncStorage.setItem(key(ownerId), JSON.stringify(categories));
  } catch {
    throw new Error('Não foi possível salvar as categorias neste dispositivo.');
  }
}

function validatedName(
  name: string,
  categories: Category[],
  currentId?: string,
) {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw new Error('Informe o nome da categoria.');
  if (trimmed.length > 40) throw new Error('Use até 40 caracteres no nome.');
  if (
    categories.some(
      (item) =>
        item.id !== currentId &&
        item.name.toLocaleLowerCase('pt-BR') ===
          trimmed.toLocaleLowerCase('pt-BR'),
    )
  ) {
    throw new Error('Já existe uma categoria com esse nome.');
  }
  return trimmed;
}

export const mockCategoryService = {
  list: read,
  async create(ownerId: string, input: CreateCategoryInput) {
    const categories = await read(ownerId);
    if (!categoryIcons.some((item) => item.value === input.icon)) {
      throw new Error('Selecione um ícone válido.');
    }
    if (!categoryColors.some((item) => item.value === input.color)) {
      throw new Error('Selecione uma cor válida.');
    }
    if (
      !Number.isInteger(input.minimumStock) ||
      input.minimumStock < 0 ||
      input.minimumStock > 999
    ) {
      throw new Error('Informe um estoque mínimo entre 0 e 999.');
    }
    if (input.description.trim().length > 200) {
      throw new Error('Use até 200 caracteres na descrição.');
    }
    const category: Category = {
      id: `category-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: validatedName(input.name, categories),
      icon: input.icon,
      color: input.color,
      minimumStock: input.minimumStock,
      description: input.description.trim(),
    };
    await write(ownerId, [...categories, category]);
    return category;
  },
  async update(ownerId: string, categoryId: string, name: string) {
    const categories = await read(ownerId);
    const current = categories.find((item) => item.id === categoryId);
    if (!current) throw new Error('Categoria não encontrada.');
    const updated = {
      ...current,
      name: validatedName(name, categories, categoryId),
    };
    await write(
      ownerId,
      categories.map((item) => (item.id === categoryId ? updated : item)),
    );
    return updated;
  },
  async remove(ownerId: string, categoryId: string) {
    const categories = await read(ownerId);
    if (!categories.some((item) => item.id === categoryId)) {
      throw new Error('Categoria não encontrada.');
    }
    const ownerStoreIds = new Set(
      (await mockStoreService.listByOwner(ownerId)).map((store) => store.id),
    );
    if (
      mockStorePieces.some(
        (piece) =>
          piece.categoryId === categoryId && ownerStoreIds.has(piece.storeId),
      )
    ) {
      throw new Error(
        'Esta categoria está vinculada a peças e não pode ser excluída.',
      );
    }
    await write(
      ownerId,
      categories.filter((item) => item.id !== categoryId),
    );
  },
};
