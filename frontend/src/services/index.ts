import { appConfig } from '@/config/env';
import type { AuthService } from '@/services/contracts/auth-service';
import type { StoreService } from '@/services/contracts/store-service';
import { mockAuthService } from '@/services/mock/mock-auth-service';
import { mockStoreService } from '@/services/mock/mock-store-service';

if (appConfig.dataSource !== 'mock') {
  throw new Error(
    'A integração com a API ainda não está disponível. Use EXPO_PUBLIC_DATA_SOURCE=mock.',
  );
}

export const authService: AuthService = mockAuthService;
export const storeService: StoreService = mockStoreService;
