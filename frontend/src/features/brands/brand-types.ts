export const brandTiers = [
  { id: 'luxury', label: 'Luxo', points: 40 },
  { id: 'premium', label: 'Premium', points: 30 },
  { id: 'intermediate', label: 'Intermediária', points: 20 },
  { id: 'popular', label: 'Popular', points: 10 },
  { id: 'other', label: 'Desconhecida / Outra', points: 5 },
] as const;

export type BrandTier = (typeof brandTiers)[number]['id'];

export type Brand = {
  id: string;
  name: string;
  tier: BrandTier;
  isSystem: boolean;
};
