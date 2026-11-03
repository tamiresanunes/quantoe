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

As propriedades e exemplos dos componentes reutilizáveis estão em [docs/COMPONENTS.md](docs/COMPONENTS.md).

- `src/app/`: rotas e layouts do Expo Router.
- `src/features/`: estado e lógica de interface por domínio.
- `src/services/contracts/`: interfaces usadas pelas telas.
- `src/services/mock/`: implementações temporárias em memória.
- `src/mocks/fixtures/`: dados fictícios imutáveis de origem.
- `src/types/`: modelos compartilhados.
- `src/config/`: configuração pública do aplicativo.
- `src/theme/colors.ts`: paleta, cores semânticas e status das peças para o tema claro.
- `src/theme/styles.ts`: estilos reutilizáveis de telas, textos, campos e cards.
- `src/theme/typography.ts`: famílias, tamanhos e estilos de texto.
- `src/theme/spacing.ts`: escala de espaçamento, medidas e raios dos componentes.
- `src/components/`: componentes compartilhados, incluindo o botão primário e secundário.

As telas importam serviços por `src/services/index.ts`, que hoje seleciona apenas mocks. `EXPO_PUBLIC_DATA_SOURCE=mock` é o único modo suportado; `EXPO_PUBLIC_API_URL` está reservado para a integração futura. Valores `EXPO_PUBLIC_*` ficam visíveis no aplicativo e não devem conter segredos.

## Cores

Use `colors` de `src/theme/colors.ts` para novas interfaces, evitando valores hexadecimais nas telas. `palette` guarda as cores da marca; `colors` nomeia o uso de cada cor, inclusive estados semânticos e status das peças. `globalStyles` reúne estilos básicos compartilhados. O aplicativo inicia em tema claro.

O texto auxiliar foi reservado para superfícies `#FFFCF8`, onde atinge contraste AA para texto comum. Em campos de formulário, use `colors.border.strong`; a borda neutra é adequada para divisórias e cards decorativos, mas não delimita controles com contraste suficiente.

## Tipografia e espaçamento

Use `textStyles` de `src/theme/typography.ts` para a hierarquia visual: DM Serif Display em display, H1 e H2; DM Sans nos demais estilos. As fontes são carregadas no layout raiz antes da exibição das telas. Os textos mantêm o ajuste de tamanho do dispositivo, e as telas têm rolagem para acomodar fontes ampliadas.

Use `spacing`, `layout`, `componentSizes` e `radii` de `src/theme/spacing.ts` em novos componentes. Os valores de espaçamento seguem a escala de 4 a 64 dp; a margem horizontal das telas é 20 dp. Botões e campos usam altura mínima de 52 dp, preservando espaço para textos ampliados.
