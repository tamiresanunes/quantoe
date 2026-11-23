import AsyncStorage from '@react-native-async-storage/async-storage';

import { mockUsers } from '@/mocks/fixtures/users';
import { isValidEmail } from '@/features/auth/validation';
import type {
  AuthService,
  SignUpInput,
  UpdateProfileInput,
} from '@/services/contracts/auth-service';
import type { User } from '@/types/models';

// As contas de demonstração usam credenciais locais; a sessão ativa é persistida.
const demoPassword = 'Senha123!';
const sessionKey = '@quantoe:auth-session';
const accounts = mockUsers.map((user) => ({
  user: { ...user },
  password: demoPassword,
}));
let currentUser: User | null = null;

const simulateRequest = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 650));

export const mockAuthService: AuthService = {
  async signIn(email, password) {
    await simulateRequest();
    const account = accounts.find(
      (item) => item.user.email === email.trim().toLowerCase(),
    );
    if (!account || account.password !== password) {
      throw new Error('E-mail ou senha incorretos.');
    }
    await AsyncStorage.setItem(sessionKey, JSON.stringify(account.user));
    currentUser = account.user;
    return account.user;
  },
  async signUp(input: SignUpInput) {
    await simulateRequest();
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || !isValidEmail(email) || input.password.trim().length < 8) {
      throw new Error('Verifique nome, e-mail e senha.');
    }
    if (accounts.some((account) => account.user.email === email)) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    const user: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      photoUrl: input.photoUrl ?? null,
    };
    accounts.push({ user, password: input.password });
    await AsyncStorage.setItem(sessionKey, JSON.stringify(user));
    currentUser = user;
    return user;
  },
  async updateProfile(input: UpdateProfileInput) {
    await simulateRequest();
    if (!currentUser)
      throw new Error('Entre na sua conta para editar seus dados.');
    const account = accounts.find((item) => item.user.id === currentUser?.id);
    if (!account) throw new Error('Conta não encontrada.');
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name) throw new Error('Informe seu nome.');
    if (!isValidEmail(email)) throw new Error('Informe um e-mail válido.');
    if (
      accounts.some(
        (item) => item.user.id !== account.user.id && item.user.email === email,
      )
    ) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    if (input.currentPassword || input.newPassword) {
      if (account.password !== input.currentPassword)
        throw new Error('A senha atual está incorreta.');
      if (!input.newPassword || input.newPassword.length < 8) {
        throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
      }
      account.password = input.newPassword;
    }
    account.user = { ...account.user, name, email };
    await AsyncStorage.setItem(sessionKey, JSON.stringify(account.user));
    currentUser = account.user;
    return account.user;
  },
  async signOut() {
    await AsyncStorage.removeItem(sessionKey);
    currentUser = null;
  },
  async requestPasswordReset() {
    await simulateRequest();
    // Demonstração: nenhuma mensagem é enviada e a existência da conta não é revelada.
  },
  async getCurrentUser() {
    if (currentUser) return currentUser;
    const stored = await AsyncStorage.getItem(sessionKey);
    if (!stored) return null;
    try {
      const user = JSON.parse(stored) as User;
      if (
        typeof user.id !== 'string' ||
        typeof user.name !== 'string' ||
        typeof user.email !== 'string'
      ) {
        return null;
      }
      currentUser = user;
    } catch {
      return null;
    }
    return currentUser;
  },
};
