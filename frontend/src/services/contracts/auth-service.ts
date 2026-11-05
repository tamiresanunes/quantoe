import type { User } from '@/types/models';

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  photoUrl?: string | null;
}

export interface AuthService {
  signIn(email: string, password: string): Promise<User>;
  signUp(input: SignUpInput): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
