import type { User } from '@/types/models';

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  photoUrl?: string | null;
}

export interface UpdateProfileInput {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthService {
  signIn(email: string, password: string): Promise<User>;
  signUp(input: SignUpInput): Promise<User>;
  updateProfile(input: UpdateProfileInput): Promise<User>;
  requestPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
