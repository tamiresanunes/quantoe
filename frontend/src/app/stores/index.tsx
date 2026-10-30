import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { useAuth } from '@/features/auth/auth-context';
import { storeService } from '@/services';
import { globalStyles } from '@/theme/styles';
import type { Store } from '@/types/models';

export default function StoresScreen() {
  const { user, signOut } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    await signOut();
    router.replace('/auth/login');
  }

  return (
    <ScrollView
      contentContainerStyle={globalStyles.screenContent}
      style={globalStyles.screen}
    >
      <View style={globalStyles.headingGroup}>
        <Text style={globalStyles.title}>Minhas lojas</Text>
        <Text style={globalStyles.body}>{user?.name}</Text>
      </View>
      {loading ? (
        <Text style={globalStyles.body}>Carregando lojas...</Text>
      ) : null}
      {error ? <Text style={globalStyles.error}>{error}</Text> : null}
      {!loading && !error && stores.length === 0 ? (
        <Text style={globalStyles.body}>Você ainda não tem lojas.</Text>
      ) : null}
      {stores.map((store) => (
        <View key={store.id} style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>{store.name}</Text>
          <Text style={globalStyles.body}>
            {store.city}, {store.state}
          </Text>
        </View>
      ))}
      <AppButton onPress={handleSignOut} title="Sair" variant="secondary" />
    </ScrollView>
  );
}
