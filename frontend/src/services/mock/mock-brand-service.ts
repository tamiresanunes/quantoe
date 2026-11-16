import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  brandTiers,
  type Brand,
  type BrandTier,
} from '@/features/brands/brand-types';
import { systemBrands } from '@/mocks/fixtures/brands';
import { mockAuthService } from '@/services/mock/mock-auth-service';

export type BrandInput = {
  name: string;
  tier: BrandTier;
  minValue: number;
  maxValue: number;
  country: string;
};

function storageKey(ownerId: string) {
  return `@quantoe/brands/v1/${encodeURIComponent(ownerId)}`;
}

async function requireOwner(ownerId: string) {
  const user = await mockAuthService.getCurrentUser();
  if (user?.id !== ownerId) throw new Error('Acesso às marcas não autorizado.');
}

function validCustomBrands(value: unknown): value is Brand[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0 &&
        item.isSystem === false &&
        brandTiers.some((tier) => tier.id === item.tier) &&
        (item.minValue === undefined ||
          (typeof item.minValue === 'number' &&
            Number.isFinite(item.minValue) &&
            item.minValue >= 0)) &&
        (item.maxValue === undefined ||
          (typeof item.maxValue === 'number' &&
            Number.isFinite(item.maxValue) &&
            item.maxValue >= 0)) &&
        (item.country === undefined || typeof item.country === 'string'),
    )
  );
}

async function readCustom(ownerId: string): Promise<Brand[]> {
  await requireOwner(ownerId);
  let stored: string | null;
  try {
    stored = await AsyncStorage.getItem(storageKey(ownerId));
  } catch {
    throw new Error('Não foi possível carregar as marcas cadastradas.');
  }
  if (stored === null) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (validCustomBrands(parsed)) return parsed;
  } catch {
    // O dado local não pode ser usado.
  }
  throw new Error('As marcas salvas estão inválidas.');
}

async function writeCustom(ownerId: string, brands: Brand[]) {
  try {
    await AsyncStorage.setItem(storageKey(ownerId), JSON.stringify(brands));
  } catch {
    throw new Error('Não foi possível salvar as marcas neste dispositivo.');
  }
}

function normalizedName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function validatedInput(
  input: BrandInput,
  custom: Brand[],
  currentId?: string,
) {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (!name) throw new Error('Informe o nome da marca.');
  if (name.length > 50) throw new Error('Use até 50 caracteres no nome.');
  if (!brandTiers.some((tier) => tier.id === input.tier)) {
    throw new Error('Selecione um setor válido.');
  }
  if (
    !Number.isFinite(input.minValue) ||
    !Number.isFinite(input.maxValue) ||
    input.minValue < 0 ||
    input.maxValue < input.minValue ||
    input.maxValue > 1_000_000_000
  ) {
    throw new Error('Confira a faixa de valorização da marca.');
  }
  const country = input.country.trim().replace(/\s+/g, ' ');
  if (!country) throw new Error('Informe o país de origem.');
  if (country.length > 60) throw new Error('Use até 60 caracteres no país.');
  const target = normalizedName(name);
  if (
    [...systemBrands, ...custom].some(
      (brand) =>
        brand.id !== currentId && normalizedName(brand.name) === target,
    )
  ) {
    throw new Error('Esta marca já está cadastrada.');
  }
  return {
    name,
    tier: input.tier,
    minValue: input.minValue,
    maxValue: input.maxValue,
    country,
  };
}

export const mockBrandService = {
  async list(ownerId: string): Promise<Brand[]> {
    const custom = await readCustom(ownerId);
    return [...systemBrands, ...custom].map((brand) => ({ ...brand }));
  },
  async create(ownerId: string, input: BrandInput): Promise<Brand> {
    const custom = await readCustom(ownerId);
    const valid = validatedInput(input, custom);
    const brand: Brand = {
      id: `brand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...valid,
      isSystem: false,
    };
    await writeCustom(ownerId, [...custom, brand]);
    return { ...brand };
  },
  async update(
    ownerId: string,
    brandId: string,
    input: BrandInput,
  ): Promise<Brand> {
    const custom = await readCustom(ownerId);
    if (systemBrands.some((brand) => brand.id === brandId)) {
      throw new Error('Marcas do sistema não podem ser editadas.');
    }
    const existing = custom.find((brand) => brand.id === brandId);
    if (!existing) throw new Error('Marca não encontrada.');
    const updated: Brand = {
      ...existing,
      ...validatedInput(input, custom, brandId),
    };
    await writeCustom(
      ownerId,
      custom.map((brand) => (brand.id === brandId ? updated : brand)),
    );
    return { ...updated };
  },
  async remove(ownerId: string, brandId: string): Promise<void> {
    const custom = await readCustom(ownerId);
    if (systemBrands.some((brand) => brand.id === brandId)) {
      throw new Error('Marcas do sistema não podem ser excluídas.');
    }
    if (!custom.some((brand) => brand.id === brandId)) {
      throw new Error('Marca não encontrada.');
    }
    await writeCustom(
      ownerId,
      custom.filter((brand) => brand.id !== brandId),
    );
  },
};
