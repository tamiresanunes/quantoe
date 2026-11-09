import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { storeService } from '@/services';
import type { CreateStoreInput } from '@/services/contracts/store-service';
import type { Store, StorePiece } from '@/types/models';

type StoreDetails = Omit<CreateStoreInput, 'ownerId'>;
type StoreSnapshot = {
  ownerId: string;
  stores: Store[];
  activePieces: StorePiece[];
  error: string | null;
};

type StoreContextValue = {
  stores: Store[];
  activeStore: Store | null;
  activePieces: StorePiece[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  createStore(input: StoreDetails): Promise<Store>;
  updateStore(storeId: string, input: StoreDetails): Promise<Store>;
  removeStore(storeId: string): Promise<void>;
  activateStore(storeId: string): Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<StoreSnapshot | null>(null);

  async function load(ownerId: string) {
    const stores = await storeService.listByOwner(ownerId);
    const activeStore = stores.find((store) => store.isActive);
    const activePieces = activeStore
      ? await storeService.listPieces(ownerId, activeStore.id)
      : [];
    setSnapshot({ ownerId, stores, activePieces, error: null });
  }

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const ownerId = user.id;
    async function loadInitial() {
      try {
        const stores = await storeService.listByOwner(ownerId);
        const activeStore = stores.find((store) => store.isActive);
        const activePieces = activeStore
          ? await storeService.listPieces(ownerId, activeStore.id)
          : [];
        if (mounted)
          setSnapshot({ ownerId, stores, activePieces, error: null });
      } catch (cause) {
        if (mounted)
          setSnapshot({
            ownerId,
            stores: [],
            activePieces: [],
            error:
              cause instanceof Error
                ? cause.message
                : 'Não foi possível carregar as lojas.',
          });
      }
    }
    void loadInitial();
    return () => {
      mounted = false;
    };
  }, [user]);

  function ownerId() {
    if (!user) throw new Error('Entre na sua conta para acessar as lojas.');
    return user.id;
  }

  async function refresh() {
    await load(ownerId());
  }
  async function createStore(input: StoreDetails) {
    const id = ownerId();
    const created = await storeService.create({ ...input, ownerId: id });
    await load(id);
    return created;
  }
  async function updateStore(storeId: string, input: StoreDetails) {
    const id = ownerId();
    const updated = await storeService.update(id, storeId, input);
    await load(id);
    return updated;
  }
  async function removeStore(storeId: string) {
    const id = ownerId();
    await storeService.remove(id, storeId);
    await load(id);
  }
  async function activateStore(storeId: string) {
    const id = ownerId();
    await storeService.setActive(id, storeId);
    await load(id);
  }

  const current = snapshot?.ownerId === user?.id ? snapshot : null;
  const stores = current?.stores ?? [];
  const activeStore = stores.find((store) => store.isActive) ?? null;

  return (
    <StoreContext.Provider
      value={{
        stores,
        activeStore,
        activePieces: current?.activePieces ?? [],
        loading: !!user && !current,
        error: current?.error ?? null,
        refresh,
        createStore,
        updateStore,
        removeStore,
        activateStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStores() {
  const context = useContext(StoreContext);
  if (!context)
    throw new Error('useStores deve ser usado dentro de StoreProvider.');
  return context;
}
