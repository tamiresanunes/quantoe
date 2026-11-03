import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { AppList, AppListItem } from '@/components/app-list';
import { AppSelect } from '@/components/app-select';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useAuth } from '@/features/auth/auth-context';
import { storeService } from '@/services';
import { globalStyles } from '@/theme/styles';
import type { Store } from '@/types/models';

export default function StoresScreen() {
  const { user, signOut } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    storeService
      .listByOwner(user.id)
      .then((result) => {
        if (active) setStores(result);
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
  }, [user]);

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
      {loading ? (
        <Text style={globalStyles.body}>Carregando lojas...</Text>
      ) : null}
      {error ? <Text style={globalStyles.error}>{error}</Text> : null}
      {!loading && !error && stores.length === 0 ? (
        <Text style={globalStyles.body}>Você ainda não tem lojas.</Text>
      ) : null}
      {stores.length > 1 ? (
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
