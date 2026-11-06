import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppFeedback } from '@/components/app-feedback';
import { AppHeader } from '@/components/app-header';
import { AppList, AppListItem } from '@/components/app-list';
import { AppSelect } from '@/components/app-select';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/features/auth/auth-context';
import { storeService } from '@/services';
import { globalStyles } from '@/theme/styles';
import type { Store } from '@/types/models';

export default function StoresScreen() {
  const { storeCreated, loggedIn } = useLocalSearchParams<{
    storeCreated?: string;
    loggedIn?: string;
  }>();
  const { user, signOut } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    storeService
      .listByOwner(user.id)
      .then((result) => {
        if (!active) return;
        if (result.length === 0) {
          router.replace('/stores/create');
          return;
        }
        setStores(result);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar as lojas.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  function retryLoadingStores() {
    setLoading(true);
    setError('');
    setStores([]);
    setReloadKey((key) => key + 1);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setSignOutOpen(false);
      router.replace('/auth/login');
    } finally {
      setSigningOut(false);
    }
  }

  const sortedStores = [...stores].sort((a, b) =>
    sortBy === 'city'
      ? `${a.city}, ${a.state}`.localeCompare(`${b.city}, ${b.state}`, 'pt-BR')
      : a.name.localeCompare(b.name, 'pt-BR'),
  );

  return (
    <ScrollView
      contentContainerStyle={globalStyles.screenContent}
      style={globalStyles.screen}
    >
      <AppHeader title="Minhas lojas" subtitle={user?.name} />
      {storeCreated === '1' || loggedIn === '1' ? (
        <AppFeedback
          compact
          variant="success"
          title={
            storeCreated === '1'
              ? 'Loja cadastrada com sucesso'
              : 'Acesso realizado com sucesso'
          }
          message="Você já pode acessar suas lojas."
          onDismiss={() => router.setParams({ storeCreated: '', loggedIn: '' })}
        />
      ) : null}
      {loading ? <LoadingState message="Carregando lojas..." /> : null}
      {!loading && error ? (
        <AppFeedback
          compact
          variant="error"
          title="Falha ao carregar lojas"
          message={error}
        />
      ) : null}
      {!loading && error ? (
        <AppButton
          onPress={retryLoadingStores}
          title="Tentar novamente"
          variant="secondary"
        />
      ) : null}
      {!loading && !error && stores.length === 0 ? (
        <EmptyState
          title="Nenhuma loja encontrada"
          message="Você ainda não tem lojas cadastradas."
        />
      ) : null}
      {!loading && !error && stores.length > 1 ? (
        <AppSelect
          label="Ordenar por"
          value={sortBy}
          onChange={setSortBy}
          options={[
            { label: 'Nome', value: 'name' },
            { label: 'Cidade', value: 'city' },
          ]}
        />
      ) : null}
      {!loading && !error && stores.length > 0 ? (
        <AppList>
          {sortedStores.map((store) => (
            <AppCard key={store.id}>
              <AppListItem
                title={store.name}
                subtitle={`${store.city}, ${store.state}`}
              />
            </AppCard>
          ))}
        </AppList>
      ) : null}
      <AppButton
        onPress={() => setSignOutOpen(true)}
        title="Sair"
        variant="secondary"
      />
      <ConfirmDialog
        visible={signOutOpen}
        title="Sair da conta?"
        message="Você precisará entrar novamente para acessar suas lojas."
        confirmLabel="Sair"
        destructive
        loading={signingOut}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={handleSignOut}
      />
    </ScrollView>
  );
}
