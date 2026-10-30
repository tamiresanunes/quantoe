import { createContext, useContext, useState, type ReactNode } from 'react';

import type { SignUpInput } from '@/services/contracts/auth-service';
import { authService } from '@/services';
import type { User } from '@/types/models';

interface AuthContextValue {
  user: User | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function signIn(email: string, password: string) {
    setUser(await authService.signIn(email, password));
  }

  async function signUp(input: SignUpInput) {
    setUser(await authService.signUp(input));
  }

  async function signOut() {
    await authService.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
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
