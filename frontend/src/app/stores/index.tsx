import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { storeService } from '@/services';
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
    <View style={styles.container}>
      <Text style={styles.title}>Minhas lojas</Text>
      <Text>{user?.name}</Text>
      {loading ? <Text>Carregando lojas...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && stores.length === 0 ? (
        <Text>Você ainda não tem lojas.</Text>
      ) : null}
      {stores.map((store) => (
        <View key={store.id} style={styles.store}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text>
            {store.city}, {store.state}
          </Text>
        </View>
      ))}
      <Button onPress={handleSignOut} title="Sair" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  store: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 16 },
  storeName: { fontSize: 18, fontWeight: '600' },
  error: { color: '#B00020' },
});
