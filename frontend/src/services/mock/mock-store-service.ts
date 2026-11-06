import { mockStores } from '@/mocks/fixtures/stores';
import { citiesByState, states } from '@/features/stores/brazil-locations';
import type {
  CreateStoreInput,
  StoreService,
} from '@/services/contracts/store-service';
import { mockAuthService } from '@/services/mock/mock-auth-service';
import type { Store } from '@/types/models';

const stores: Store[] = mockStores.map((store) => ({ ...store }));

export const mockStoreService: StoreService = {
  async listByOwner(ownerId) {
    const user = await mockAuthService.getCurrentUser();
    if (user?.id !== ownerId) throw new Error('Acesso à loja não autorizado.');
    return stores
      .filter((store) => store.ownerId === ownerId)
      .map((store) => ({ ...store }));
  },
  async create(input: CreateStoreInput) {
    const user = await mockAuthService.getCurrentUser();
    if (user?.id !== input.ownerId)
      throw new Error('Acesso à loja não autorizado.');
    if (!input.name.trim()) throw new Error('Informe o nome da loja.');
    if (!states.some((state) => state.value === input.state))
      throw new Error('Selecione o estado da loja.');
    if (!(citiesByState[input.state] ?? []).includes(input.city))
      throw new Error('Selecione uma cidade válida para o estado.');
    const store: Store = {
      id: `store-${Date.now()}`,
      ownerId: input.ownerId,
      name: input.name.trim(),
      logoUrl: input.logoUrl ?? null,
      city: input.city.trim(),
      state: input.state.trim(),
    };
    stores.push(store);
    return { ...store };
  },
};
