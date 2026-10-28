# Convenções de desenvolvimento — QuantoÉ

**Estado:** convenções **propostas para adoção** no início do projeto. Não representam configuração já implementada. Mudanças devem ser registradas em pull request e refletidas nesta documentação.

## 1. Princípios

1. **Frontend primeiro:** até a milestone 05, as telas usam serviços simulados e não dependem da API.
2. **Contratos estáveis:** telas consomem interfaces de serviços, nunca importam fixtures diretamente.
3. **Separação por domínio:** código de autenticação, lojas, catálogos, peças, precificação e estoque deve ser organizado por responsabilidade.
4. **TypeScript estrito:** evitar `any`; usar tipos explícitos nas fronteiras e validar dados externos em tempo de execução.
5. **Regras testáveis:** cálculo de precificação, alertas e indicadores devem ser funções puras sempre que possível.
6. **Isolamento de loja:** toda consulta e alteração de peças deve respeitar a loja ativa; no backend, a autorização deve ser validada independentemente do frontend.

## 2. Estrutura sugerida

```text
frontend/src/
├── components/             # Button, TextField, EmptyState etc.
├── features/
│   ├── auth/               # Telas, hooks e componentes do fluxo de acesso
│   ├── stores/             # Seleção e cadastro de lojas
│   ├── categories/         # Categorias
│   ├── brands/             # Marcas
│   ├── pieces/             # Cadastro, edição, listagem e detalhes
│   ├── pricing/            # Visualização da precificação
│   └── inventory/          # Filtros, alertas e dashboard
├── navigation/
├── services/
│   ├── contracts/          # Interfaces dos serviços
│   ├── mock/               # Implementações simuladas
│   └── index.ts            # Seleção da implementação em uso
├── mocks/
│   ├── fixtures/           # Dados fictícios consistentes
│   └── scenarios/          # Casos vazios, erros, limites
├── theme/
├── types/
└── utils/

backend/src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── stores/
│   ├── categories/
│   ├── brands/
│   ├── pieces/
│   ├── pricing/
│   └── inventory/
├── plugins/
└── lib/
```

A estrutura do backend será criada somente na milestone 06. **Não criar pastas vazias apenas para reproduzir esta árvore**: criar módulos quando houver código real.

## 3. Nomenclatura

| Elemento | Convenção proposta | Exemplo |
| --- | --- | --- |
| Componentes React e telas | `PascalCase.tsx` | `PieceDetailsScreen.tsx` |
| Tipos, interfaces e enums | `PascalCase` | `Piece`, `PieceStatus` |
| Variáveis e funções | `camelCase` | `calculateSuggestedPrice` |
| Hooks React | prefixo `use` | `useActiveStore` |
| Constantes globais | `UPPER_SNAKE_CASE` | `DEFAULT_STALE_DAYS` |
| Arquivos utilitários/serviços | `kebab-case.ts` | `pricing-calculator.ts` |
| Diretórios de domínio | `kebab-case` ou nomes simples | `pieces`, `inventory` |
| Testes | `*.test.ts(x)` | `pricing-calculator.test.ts` |
| Branches | `tipo/issue-numero-descricao` | `feat/issue-08-piece-form` |

**Idioma:** código e nomes técnicos em inglês; textos exibidos ao usuário em português brasileiro. Mensagens de commit podem ser em português, mantendo o tipo padronizado.

## 4. TypeScript e React Native

- Habilitar `strict: true` no TypeScript.
- Preferir `type` para uniões e modelos simples; `interface` para contratos extensíveis de serviços. Consistência importa mais do que a palavra-chave.
- Tipar props, retornos de serviços e estados relevantes.
- Evitar lógica de negócio complexa dentro de componentes de apresentação.
- Preferir componentes pequenos, reutilizáveis e acessíveis.
- Usar tokens de `theme/` em vez de repetir cores e espaçamentos literais.
- Formatar moeda e data por funções utilitárias, sem misturar formato de exibição e persistência.
- Não armazenar senhas ou segredos em fixtures nem em código-fonte.

## 5. Serviços e mocks

As telas devem depender de interfaces:

```ts
export interface PieceService {
  listByStore(storeId: string, filters?: PieceFilters): Promise<Piece[]>;
  getById(storeId: string, pieceId: string): Promise<Piece | null>;
  create(input: CreatePieceInput): Promise<Piece>;
  update(storeId: string, pieceId: string, input: UpdatePieceInput): Promise<Piece>;
}
```

A implementação mockada e a futura implementação HTTP devem respeitar o mesmo contrato. Os serviços simulados podem usar cópias mutáveis em memória para representar cadastro/edição durante uma sessão de desenvolvimento, mas **as fixtures de origem devem permanecer imutáveis**. Não introduzir atraso artificial em toda operação; usar cenários controlados para testar loading e erro.

A definição detalhada dos modelos está em [MOCK_DATA.md](MOCK_DATA.md).

## 6. Git e GitHub

### Branches

- `main`: código integrado e revisado.
- `feat/issue-XX-resumo`: nova funcionalidade.
- `fix/issue-XX-resumo`: correção.
- `chore/issue-XX-resumo`: configuração/manutenção.
- `docs/issue-XX-resumo`: documentação.
- `test/issue-XX-resumo`: testes.

Evitar commits diretamente na `main` após a configuração inicial. Uma branch por issue é o padrão preferido.

### Commits — Conventional Commits

Formato: `tipo(escopo): descrição curta`.

```text
feat(pieces): cria formulário de cadastro
fix(pricing): corrige limite da faixa de valorização
chore(frontend): configura lint e formatter
docs: documenta contratos dos mocks
test(inventory): cobre exclusão de peças vendidas
```

Tipos recomendados: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `style`.

### Pull requests

Cada PR deve informar:

- Issue relacionada (`Closes #N`, com o número real do GitHub).
- O que foi alterado e por quê.
- Como testar; evidências visuais quando houver mudança de interface.
- Checklist de aceite da issue.
- Riscos, limitações ou pendências conhecidas.

**Fluxo:** `Todo → In Progress → In Review → Done`. Fazer merge apenas após os critérios de aceite serem verificados.

## 7. Qualidade e testes

- **Lint e formatação:** configurar ESLint e Prettier (ou alternativas compatíveis) na issue #01.
- **Testes unitários:** priorizar precificação, filtros, alertas, contagens e validações.
- **Testes de interface:** cobrir estados de loading, erro, vazio e sucesso.
- **Testes de integração:** validar serviços reais nas issues #25–#29.
- **Testes ponta a ponta:** cobrir jornadas críticas na issue #30.
- **Acessibilidade:** labels em campos, contraste, áreas de toque adequadas e feedback compreensível.

Não exigir uma porcentagem arbitrária de cobertura no início. Cada issue deve ter testes proporcionais ao risco e à regra implementada.

## 8. API, segurança e dados

- Backend deve validar entradas e autorização; não confiar no `storeId` recebido sem verificar propriedade da loja.
- Não expor `SUPABASE_SERVICE_ROLE_KEY`, credenciais do banco ou tokens privados no app Expo.
- Variáveis `EXPO_PUBLIC_*` são públicas no bundle e não podem conter segredos.
- Armazenar senhas apenas por mecanismo seguro de autenticação; não criar uma segunda tabela com senhas em texto puro.
- Registrar logs sem credenciais ou dados sensíveis.
- Usar migrations versionadas para alterações no banco.
- Definir contratos HTTP e estratégia de sessão quando a milestone 06 começar; não inventar endpoints como se já estivessem disponíveis.
- Se Supabase Auth for adotado como fonte de identidade, alinhar o modelo local de usuário ao identificador retornado pelo provedor, sem duplicar responsabilidades de autenticação.

## 9. Critério de pronto (Definition of Done)

Uma issue pode ser concluída quando:

- [ ] Os itens previstos na issue foram implementados ou tiveram desvios justificados.
- [ ] Os critérios de aceite foram verificados.
- [ ] Não há erros conhecidos críticos no fluxo entregue.
- [ ] O código segue as convenções de nomes e organização.
- [ ] Os testes aplicáveis foram executados.
- [ ] A documentação foi atualizada quando o contrato ou a regra mudou.
- [ ] A alteração foi integrada à branch principal via PR, conforme o fluxo adotado.

## 10. Decisões a registrar futuramente

Quando surgirem, documentar: versão do Node, gerenciador de pacotes, biblioteca de navegação, formulários e validação, biblioteca de testes, estratégia de estado global, padrão de erros HTTP, estratégia de upload e políticas de deploy. Não é necessário decidir tudo antes de iniciar a issue #01.
