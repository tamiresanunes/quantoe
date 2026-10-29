
import { View, Text, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>QuantoÉ</Text>

      <Text style={styles.subtitle}>
        Bem-vinda ao QuantoÉ!
      </Text>

      <Button
        title="Entrar (simulação)"
        onPress={() => router.push('/stores')}
      />

      <Button
        title="Criar conta"
        onPress={() => router.push('/auth/register')}
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
