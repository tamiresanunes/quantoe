
import { View, Text, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>

      <Text style={styles.subtitle}>
        Bem-vinda ao QuantoÉ!
      </Text>

      <Text style={styles.description}>
        Aqui você poderá criar sua conta para gerenciar
        seus brechós e precificar suas peças.
      </Text>

      <Button
        title="Voltar para login"
        onPress={() => router.replace('/auth/login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
  },
});
