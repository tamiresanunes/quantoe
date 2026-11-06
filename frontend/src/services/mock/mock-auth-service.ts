import { mockUsers } from '@/mocks/fixtures/users';
import { isValidEmail } from '@/features/auth/validation';
import type {
  AuthService,
  SignUpInput,
} from '@/services/contracts/auth-service';
import type { User } from '@/types/models';

// Contas e senhas de demonstração existem apenas na memória da sessão.
const demoPassword = 'Senha123!';
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
    currentUser = user;
    return user;
  },
  async signOut() {
    currentUser = null;
  },
  async requestPasswordReset() {
    await simulateRequest();
    // Demonstração: nenhuma mensagem é enviada e a existência da conta não é revelada.
  },
  async getCurrentUser() {
    return currentUser;
  },
};
