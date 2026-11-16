import type { Brand, BrandTier } from '@/features/brands/brand-types';

const namesByTier: Record<BrandTier, readonly string[]> = {
  luxury: [
    'Prada',
    'Gucci',
    'Louis Vuitton',
    'Chanel',
    'Dior',
    'Valentino',
    'Burberry',
    'Balenciaga',
    'Saint Laurent',
    'Versace',
  ],
  premium: [
    'Tommy Hilfiger',
    'Calvin Klein',
    'Lacoste',
    'Hugo Boss',
    'Ralph Lauren',
    'Armani Exchange',
    'Michael Kors',
  ],
  intermediate: [
    'Farm',
    'Zara',
    "Levi's",
    'Nike',
    'Adidas',
    'Vans',
    'Converse',
    'Puma',
    'Colcci',
    'Shoulder',
  ],
  popular: [
    'Renner',
    'C&A',
    'Riachuelo',
    'Marisa',
    'Hering',
    'YouCom',
    'Pernambucanas',
  ],
  other: ['Desconhecida / Outra'],
};

export const systemBrands: readonly Brand[] = Object.entries(
  namesByTier,
).flatMap(([tier, names]) =>
  names.map((name, index) => ({
    id: `system-${tier}-${index}`,
    name,
    tier: tier as BrandTier,
    isSystem: true,
  })),
);
