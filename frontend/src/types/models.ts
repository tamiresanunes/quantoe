export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  photoUrl: string | null;
}

export interface Store {
  id: ID;
  ownerId: ID;
  name: string;
  logoUrl: string | null;
  city: string;
  state: string;
  pieceCount: number;
  isActive: boolean;
}

export interface StorePiece {
  id: ID;
  storeId: ID;
  categoryId: ID;
  name: string;
  code?: string;
  photoUri?: string | null;
  size?: string;
  brandId?: ID;
  condition?: PieceCondition;
  style?: PieceStyle;
  acquisitionPrice?: number;
  quantity?: number;
  acquisitionPlace?: string;
  acquisitionDate?: string;
  collection?: string;
  notes?: string;
  status?: PieceStatus;
  salePrice?: number;
}

export type PieceCondition =
  'new_with_tag' | 'excellent' | 'very_good' | 'good' | 'fair';
export type PieceStyle =
  | 'vintage'
  | 'old_money'
  | 'y2k'
  | 'retro'
  | 'streetwear'
  | 'cottagecore'
  | 'boho'
  | 'classic'
  | 'minimalist'
  | 'sporty'
  | 'social'
  | 'casual';
export type PieceStatus = 'available' | 'reserved' | 'clearance' | 'sold';

export interface Category {
  id: ID;
  name: string;
  icon?: CategoryIcon;
  color?: string;
  minimumStock?: number;
  description?: string;
}

export type CategoryIcon =
  'clothing' | 'jewelry' | 'bag' | 'shoes' | 'watch' | 'sparkles';
