# QuantoÉ — aplicativo mobile

Aplicativo Expo/React Native em TypeScript. A navegação e os serviços desta primeira etapa usam dados simulados em memória. O backend Fastify ainda não está implementado.

## Requisitos locais

- Node.js e npm.
- Expo Go ou um emulador Android/iOS para abrir o aplicativo. O alvo web também pode ser usado para conferir as rotas.

## Executar

No diretório `frontend/`:

```bash
npm install
cp .env.example .env
npm run start
```

No PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`. O Expo exibirá as opções para abrir o aplicativo. Também há scripts `npm run android`, `npm run ios` e `npm run web`.

## Verificações

```bash
npm run typecheck
npm run lint
npm run format:check
```

Para aplicar a formatação: `npm run format`.

## Fluxo de demonstração

O aplicativo começa na tela de login. Use `ana@example.com` ou `bruna@example.com` com qualquer senha não vazia. O cadastro cria um usuário apenas em memória; após entrar, a tela de lojas mostra somente as lojas do usuário atual. O botão **Sair** volta ao login. A sessão e os cadastros simulados são reiniciados ao recarregar o aplicativo. Esta autenticação serve apenas para testar navegação e isolamento visual; o backend deverá validar a identidade e a autorização.

## Organização

- `src/app/`: rotas e layouts do Expo Router.
- `src/features/`: estado e lógica de interface por domínio.
- `src/services/contracts/`: interfaces usadas pelas telas.
- `src/services/mock/`: implementações temporárias em memória.
- `src/mocks/fixtures/`: dados fictícios imutáveis de origem.
- `src/types/`: modelos compartilhados.
- `src/config/`: configuração pública do aplicativo.

As telas importam serviços por `src/services/index.ts`, que hoje seleciona apenas mocks. `EXPO_PUBLIC_DATA_SOURCE=mock` é o único modo suportado; `EXPO_PUBLIC_API_URL` está reservado para a integração futura. Valores `EXPO_PUBLIC_*` ficam visíveis no aplicativo e não devem conter segredos.
