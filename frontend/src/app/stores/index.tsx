
import { View, Text, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';


export default function StoresScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas lojas</Text>

      <Text>
        Aqui você poderá selecionar e gerenciar seus brechós.
      </Text>

      <Button
        title="Sair (simulação)"
        onPress={() => router.replace('/auth/login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
