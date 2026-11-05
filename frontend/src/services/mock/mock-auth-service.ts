import { mockUsers } from '@/mocks/fixtures/users';
import type {
  AuthService,
  SignUpInput,
} from '@/services/contracts/auth-service';
import type { User } from '@/types/models';

// Cópias mutáveis apenas durante a sessão. Nenhuma senha é salva nos mocks.
const users: User[] = mockUsers.map((user) => ({ ...user }));
let currentUser: User | null = null;

export const mockAuthService: AuthService = {
  async signIn(email, password) {
    if (!password.trim())
      throw new Error('Informe uma senha para entrar na simulação.');
    const user = users.find(
      (item) => item.email === email.trim().toLowerCase(),
    );
    if (!user) throw new Error('E-mail não encontrado nos dados de exemplo.');
    currentUser = user;
    return user;
  },
  async signUp(input: SignUpInput) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || !email || !input.password.trim()) {
      throw new Error('Preencha nome, e-mail e senha.');
    }
    if (users.some((user) => user.email === email)) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    const user: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      photoUrl: input.photoUrl ?? null,
    };
    users.push(user);
    currentUser = user;
    return user;
  },
  async signOut() {
    currentUser = null;
  },
  async getCurrentUser() {
    return currentUser;
  },
};
