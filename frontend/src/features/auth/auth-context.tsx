import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type {
  SignUpInput,
  UpdateProfileInput,
} from '@/services/contracts/auth-service';
import { authService } from '@/services';
import type { User } from '@/types/models';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<void>;
  updateProfile(input: UpdateProfileInput): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authService
      .getCurrentUser()
      .then(
        (currentUser) => {
          if (mounted) setUser(currentUser);
        },
        () => {
          if (mounted) setUser(null);
        },
      )
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(email: string, password: string) {
    setUser(await authService.signIn(email, password));
  }

  async function signUp(input: SignUpInput) {
    setUser(await authService.signUp(input));
  }

  async function updateProfile(input: UpdateProfileInput) {
    setUser(await authService.updateProfile(input));
  }

  async function signOut() {
    await authService.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, updateProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
