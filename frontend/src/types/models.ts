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
}

export interface Category {
  id: ID;
  name: string;
}
