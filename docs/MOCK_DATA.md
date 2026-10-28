# Modelos e dados simulados — QuantoÉ

**Estado:** proposta de contratos TypeScript e fixtures para implementar o frontend antes do backend. **Não são tabelas Prisma nem contratos HTTP já aprovados.** Os campos e as regras derivados da especificação estão identificados; decisões adicionais são explicitamente propostas.

## 1. Objetivo e princípios

Os mocks devem permitir desenvolver e testar telas de login, lojas, catálogos, peças, precificação, filtros, alertas e dashboard sem uma API disponível.

- Usar **IDs estáveis** e relacionamentos consistentes entre fixtures.
- Manter dados de **pelo menos dois usuários e duas lojas** para testar isolamento.
- Separar fixtures (`mocks/fixtures/`) de serviços simulados (`services/mock/`).
- Componentes não importam fixtures diretamente; consomem serviços tipados.
- Representar sucesso, erro, carregamento e estado vazio com cenários controlados.
- Não usar dados reais de clientes, senhas ou credenciais.

## 2. Modelos TypeScript propostos

```ts
export type ID = string;
export type ISODate = string; // Ex.: 2026-10-01, data civil

// Dinheiro em centavos inteiros: proposta para evitar erros de ponto flutuante.
export type MoneyCents = number;

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
}

export interface Category {
  id: ID;
  ownerId: ID;
  name: string;
}

export type BrandClass =
  | 'LUXURY'
  | 'PREMIUM'
  | 'INTERMEDIATE'
  | 'POPULAR'
  | 'UNKNOWN';

export interface Brand {
  id: ID;
  name: string;
  classification: BrandClass;
  countryOfOrigin: string | null;
  appreciationRange: string | null;
  createdByUserId: ID | null; // null = marca predefinida do sistema
}

export type PieceCondition =
  | 'NEW_WITH_TAG'
  | 'EXCELLENT'
  | 'VERY_GOOD'
  | 'GOOD'
  | 'FAIR';

export type PieceStyle =
  | 'VINTAGE'
  | 'OLD_MONEY'
  | 'Y2K'
  | 'RETRO'
  | 'STREETWEAR'
  | 'COTTAGECORE'
  | 'BOHO'
  | 'CLASSIC'
  | 'MINIMALIST'
  | 'SPORTY'
  | 'SOCIAL'
  | 'CASUAL';

export type PieceStatus =
  | 'AVAILABLE'  // Livre
  | 'RESERVED'   // Reservada
  | 'CLEARANCE'  // Liquidação
  | 'SOLD';      // Vendida

export interface Piece {
  id: ID;
  storeId: ID;
  categoryId: ID;
  brandId: ID;
  condition: PieceCondition;
  style: PieceStyle;
  acquisitionPriceCents: MoneyCents;
  acquisitionPlace: string;
  acquisitionDate: ISODate;
  collection: string | null;
  notes: string | null;
  status: PieceStatus;
  suggestedPriceCents: MoneyCents;
  finalPriceCents: MoneyCents;
}

// Proposta: configurações associadas à loja ativa.
export interface StorePreferences {
  storeId: ID;
  staleAfterDays: number; // valor inicial sugerido: 90
  minimumStockByCategory: Record<ID, number>; // valor inicial sugerido: 5
}

export interface PieceFilters {
  categoryId?: ID;
  brandId?: ID;
  minPriceCents?: MoneyCents;
  maxPriceCents?: MoneyCents;
  condition?: PieceCondition;
  status?: PieceStatus;
  search?: string; // melhoria de interface; RF10 exige filtros
}

export interface PricingResult {
  appreciationScore: number;
  appreciationPercent: number;
  suggestedPriceCents: MoneyCents;
  estimatedProfitCents: MoneyCents;
}
```

### Observações sobre o modelo

- `Category.ownerId` é **por usuário**, conforme RF04; uma categoria pode ser utilizada em lojas diferentes do mesmo proprietário.
- `Brand.createdByUserId` distingue marcas do sistema e marcas criadas por usuários. É uma **proposta de modelagem**; o documento não especifica o escopo de visibilidade das marcas personalizadas.
- `StorePreferences` por loja é uma **decisão proposta**. RF08 e RF09 exigem limites configuráveis pelo usuário, mas não determinam que sejam por loja.
- `suggestedPriceCents` e `finalPriceCents` foram separados porque RF07 permite substituir a sugestão pelo valor definido pelo usuário.
- A especificação não exige fotos de peças. Não adicionar `pieceImageUrl` como campo obrigatório sem decisão de produto.
- O documento exige informações de marca como nome, faixa de valorização, país de origem e classificação; o significado operacional de `appreciationRange` **não está definido**. Não confundir esse campo com o percentual calculado a partir do índice de pontos. A obrigatoriedade exata desses metadados deve ser refinada antes do cadastro real.
- IDs, centavos inteiros, nomes de enums e nulabilidade são escolhas técnicas propostas e poderão ser refinados ao criar o schema Prisma.

## 3. Tabelas de pontuação — especificação de requisitos

### Classificação da marca

| Classe | Pontos |
| --- | ---: |
| Luxo | 40 |
| Premium | 30 |
| Intermediária | 20 |
| Popular | 10 |
| Desconhecida / Outra | 5 |

### Estado de conservação

| Estado | Pontos |
| --- | ---: |
| Novo com etiqueta | 35 |
| Excelente | 30 |
| Muito bom | 25 |
| Bom | 20 |
| Regular | 10 |

### Estilo

| Estilo | Pontos |
| --- | ---: |
| Vintage | 20 |
| Old Money | 20 |
| Y2K | 18 |
| Retrô | 15 |
| Streetwear | 15 |
| Cottagecore | 15 |
| Boho | 12 |
| Clássico | 12 |
| Minimalista | 10 |
| Esportivo | 10 |
| Social | 10 |
| Casual | 8 |

### Conversão do índice em valorização

| Índice total | Valorização |
| --- | ---: |
| 20–39 | 40% |
| 40–59 | 70% |
| 60–79 | 100% |
| 80–99 | 140% |
| 100 ou mais | 180% |

**Fórmulas:**

```text
indice = pontosDaMarca + pontosDaConservacao + pontosDoEstilo
precoSugerido = precoAquisicao × (1 + percentual / 100)
lucroEstimado = precoSugerido − precoAquisicao
lucroPotencial = soma(precosFinaisDasPecasAtivas) − soma(aquisicoesDasPecasAtivas)
```

O lucro é **estimado/potencial**, não lucro líquido contábil: não há regras documentadas para impostos, frete, taxas ou custos indiretos. A faixa abaixo de 20 pontos não aparece na especificação; com os três critérios obrigatórios e suas pontuações atuais, o mínimo válido é 23 pontos.

### Implementação de referência para o mock

```ts
export const BRAND_POINTS: Record<BrandClass, number> = {
  LUXURY: 40,
  PREMIUM: 30,
  INTERMEDIATE: 20,
  POPULAR: 10,
  UNKNOWN: 5,
};

export const CONDITION_POINTS: Record<PieceCondition, number> = {
  NEW_WITH_TAG: 35,
  EXCELLENT: 30,
  VERY_GOOD: 25,
  GOOD: 20,
  FAIR: 10,
};

export const STYLE_POINTS: Record<PieceStyle, number> = {
  VINTAGE: 20,
  OLD_MONEY: 20,
  Y2K: 18,
  RETRO: 15,
  STREETWEAR: 15,
  COTTAGECORE: 15,
  BOHO: 12,
  CLASSIC: 12,
  MINIMALIST: 10,
  SPORTY: 10,
  SOCIAL: 10,
  CASUAL: 8,
};

export function calculatePricing(
  acquisitionPriceCents: number,
  brandClass: BrandClass,
  condition: PieceCondition,
  style: PieceStyle,
): PricingResult {
  if (!Number.isSafeInteger(acquisitionPriceCents) || acquisitionPriceCents < 0) {
    throw new Error('Preço de aquisição inválido');
  }

  const appreciationScore =
    BRAND_POINTS[brandClass] + CONDITION_POINTS[condition] + STYLE_POINTS[style];

  const appreciationPercent =
    appreciationScore >= 100 ? 180 :
    appreciationScore >= 80 ? 140 :
    appreciationScore >= 60 ? 100 :
    appreciationScore >= 40 ? 70 :
    appreciationScore >= 20 ? 40 :
    (() => { throw new Error('Índice de valorização inválido'); })();

  const suggestedPriceCents = Math.round(
    acquisitionPriceCents * (1 + appreciationPercent / 100),
  );

  return {
    appreciationScore,
    appreciationPercent,
    suggestedPriceCents,
    estimatedProfitCents: suggestedPriceCents - acquisitionPriceCents,
  };
}
```

**Nota de arredondamento:** `Math.round` é uma convenção provisória para o frontend. A política definitiva de arredondamento monetário deve ser fixada e testada no backend.

## 4. Fixtures de exemplo

```ts
export const mockUsers: User[] = [
  { id: 'user-01', name: 'Ana Silva', email: 'ana@example.com', photoUrl: null },
  { id: 'user-02', name: 'Bruna Costa', email: 'bruna@example.com', photoUrl: null },
];

export const mockStores: Store[] = [
  { id: 'store-01', ownerId: 'user-01', name: 'Garimpo da Ana', logoUrl: null, city: 'Rio de Janeiro', state: 'RJ' },
  { id: 'store-02', ownerId: 'user-01', name: 'Garimpo Online', logoUrl: null, city: 'Niterói', state: 'RJ' },
  { id: 'store-03', ownerId: 'user-02', name: 'Brechó da Bruna', logoUrl: null, city: 'São Paulo', state: 'SP' },
];

export const mockCategories: Category[] = [
  { id: 'cat-01', ownerId: 'user-01', name: 'Vestidos' },
  { id: 'cat-02', ownerId: 'user-01', name: 'Jaquetas' },
  { id: 'cat-03', ownerId: 'user-02', name: 'Vestidos' }, // permitido: proprietária diferente
];

export const mockBrands: Brand[] = [
  { id: 'brand-01', name: 'Gucci', classification: 'LUXURY', countryOfOrigin: null, appreciationRange: null, createdByUserId: null },
  { id: 'brand-02', name: 'Calvin Klein', classification: 'PREMIUM', countryOfOrigin: null, appreciationRange: null, createdByUserId: null },
  { id: 'brand-03', name: 'Marca Artesanal', classification: 'UNKNOWN', countryOfOrigin: 'Brasil', appreciationRange: null, createdByUserId: 'user-01' },
];

export const mockPieces: Piece[] = [
  {
    id: 'piece-01', storeId: 'store-01', categoryId: 'cat-01', brandId: 'brand-01',
    condition: 'EXCELLENT', style: 'VINTAGE', acquisitionPriceCents: 10000,
    acquisitionPlace: 'Feira local', acquisitionDate: '2026-07-01',
    collection: 'Inverno', notes: null, status: 'AVAILABLE',
    suggestedPriceCents: 24000, finalPriceCents: 24000,
  },
  {
    id: 'piece-02', storeId: 'store-01', categoryId: 'cat-02', brandId: 'brand-03',
    condition: 'GOOD', style: 'CASUAL', acquisitionPriceCents: 4000,
    acquisitionPlace: 'Doação com custo', acquisitionDate: '2026-10-01',
    collection: null, notes: 'Peça em liquidação', status: 'CLEARANCE',
    suggestedPriceCents: 5600, finalPriceCents: 5000,
  },
  {
    id: 'piece-03', storeId: 'store-02', categoryId: 'cat-01', brandId: 'brand-02',
    condition: 'VERY_GOOD', style: 'CLASSIC', acquisitionPriceCents: 8000,
    acquisitionPlace: 'Fornecedor', acquisitionDate: '2026-09-15',
    collection: null, notes: null, status: 'SOLD',
    suggestedPriceCents: 16000, finalPriceCents: 15000,
  },
];

export const mockPreferences: StorePreferences[] = [
  { storeId: 'store-01', staleAfterDays: 90, minimumStockByCategory: { 'cat-01': 5, 'cat-02': 5 } },
  { storeId: 'store-02', staleAfterDays: 90, minimumStockByCategory: { 'cat-01': 5, 'cat-02': 5 } },
];
```

**Conferência dos exemplos:** `piece-01` = 40 + 30 + 20 = 90 pontos → 140% → R$ 240,00. `piece-02` = 5 + 20 + 8 = 33 pontos → 40% → R$ 56,00. `piece-03` = 30 + 25 + 12 = 67 pontos → 100% → R$ 160,00.

> **Regra para implementação:** fixtures com preços calculados devem preferencialmente ser geradas pelo próprio `calculatePricing`, evitando divergência entre números escritos manualmente e o algoritmo.

## 5. Comportamento dos serviços simulados

```ts
export interface AuthService {
  signIn(email: string, password: string): Promise<User>;
  signUp(input: { name: string; email: string; password: string; photoUrl?: string | null }): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

export interface StoreService {
  listByOwner(ownerId: ID): Promise<Store[]>;
  create(input: Omit<Store, 'id'>): Promise<Store>;
}

export interface CatalogService {
  listCategories(ownerId: ID): Promise<Category[]>;
  createCategory(input: Omit<Category, 'id'>): Promise<Category>;
  deleteCategory(ownerId: ID, categoryId: ID): Promise<void>;
  listBrands(userId: ID): Promise<Brand[]>;
  createBrand(input: Omit<Brand, 'id'>): Promise<Brand>;
}

export interface PieceService {
  listByStore(storeId: ID, filters?: PieceFilters): Promise<Piece[]>;
  getById(storeId: ID, pieceId: ID): Promise<Piece | null>;
  create(input: Omit<Piece, 'id'>): Promise<Piece>;
  update(storeId: ID, pieceId: ID, changes: Partial<Piece>): Promise<Piece>;
}
```

**Contratos ilustrativos:** interfaces de criação/atualização devem ser refinadas para impedir alteração indevida de campos derivados, proprietário e relacionamentos. Os exemplos acima mostram a separação arquitetural, não contratos de segurança definitivos.

### Regras que o mock deve respeitar

1. **Login:** simular sucesso, credenciais inválidas e e-mail duplicado. Não salvar senha em `User` nem em fixture persistida.
2. **Lojas:** retornar somente lojas do usuário autenticado; a seleção da loja ativa é estado da aplicação.
3. **Categorias:** impedir nomes repetidos para o mesmo usuário (comparação normalizada) e impedir exclusão quando houver peça vinculada em qualquer loja do proprietário.
4. **Marcas:** disponibilizar catálogo do sistema e marcas personalizadas visíveis ao proprietário; marcas novas iniciam como `UNKNOWN`.
5. **Peças:** validar que loja e categoria pertencem ao proprietário; listar somente peças da loja ativa.
6. **Precificação:** calcular a sugestão com as tabelas fixas; permitir valor final manual sem sobrescrever a sugestão.
7. **Filtros:** aplicar todos os critérios fornecidos em conjunto (`AND`); a faixa de preço deve usar o preço **final** (proposta a validar).
8. **Alertas de peças paradas:** calcular dias desde `acquisitionDate`; não alertar peças vendidas (proposta coerente com estoque ativo, a validar no RF08).
9. **Baixo estoque:** contar apenas status diferentes de `SOLD`, por loja e categoria.
10. **Dashboard:** excluir `SOLD`; calcular investimento pela soma das aquisições, venda potencial pela soma dos preços finais e lucro potencial pela diferença.

## 6. Cenários de teste recomendados

| Cenário | Dados necessários | Resultado esperado |
| --- | --- | --- |
| Usuário sem lojas | Lista de lojas vazia | Estado vazio com ação de cadastrar |
| Lojas isoladas | Mesmo usuário com duas lojas | Trocar loja altera peças e indicadores |
| Usuários isolados | Dois usuários diferentes | Nenhum acessa peças da outra pessoa |
| Categoria duplicada | Mesmo nome e proprietário | Erro de validação |
| Categoria em uso | Peça vinculada | Exclusão bloqueada |
| Marca personalizada | Marca nova | Classificação inicial UNKNOWN (+5) |
| Precificação mínima válida | UNKNOWN + FAIR + CASUAL | 23 pontos → +40% |
| Limite de precificação | Combinações em 39/40, 59/60, 79/80, 99/100 quando possíveis | Faixa correta |
| Preço manual | Preço final diferente do sugerido | Salvar escolha do usuário |
| Peça vendida | Status SOLD | Excluir dos indicadores ativos e baixo estoque |
| Peça parada | Aquisição anterior ao limite | Exibir alerta e sugestão de liquidação |
| Filtros combinados | Categoria + marca + status | Interseção dos critérios |
| Erro de serviço | Cenário de falha controlado | Feedback de erro e opção de tentar novamente |

**Datas:** testes de peças paradas devem receber uma data de referência fixa (ex.: `2026-10-27`) em vez de depender do relógio atual, garantindo resultados repetíveis. Datas civis `YYYY-MM-DD` não devem ser convertidas inadvertidamente em fusos que alterem o dia.

## 7. Migração dos mocks para o backend

1. Manter os componentes dependentes das interfaces de serviços.
2. Criar implementações HTTP na milestone 07 sem alterar o contrato público das telas.
3. Validar a correspondência dos enums e formatos monetários entre TypeScript e Prisma.
4. Substituir autenticação simulada por sessão real e autorização no servidor.
5. Remover imports diretos de fixtures das telas.
6. Testar as mesmas jornadas com dados reais e atualizar os contratos quando necessário.

## 8. Pendências de produto e arquitetura

- Confirmar se preferências de alerta são globais do usuário ou específicas de cada loja.
- Confirmar valores iniciais de 90 dias e 5 peças (não definidos no documento original).
- Definir a semântica e obrigatoriedade da “faixa de valorização” no cadastro de marcas, distinta do percentual calculado.
- Definir a visibilidade de marcas personalizadas (privadas por usuário ou compartilhadas).
- Definir se a data de aquisição pode ser futura e se preço de aquisição zero é permitido.
- Definir como atualizar preço sugerido quando a classificação de uma marca mudar.
- Confirmar que filtros por faixa de preço utilizam o preço final.
- Definir políticas de imagens, arredondamento e autenticação na implementação real.

Essas pendências **não impedem iniciar as telas**; devem ser registradas nas issues correspondentes antes de integrar o backend.
