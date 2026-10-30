# QuantoÉ

> Precificação assistida e gestão de estoque para brechós.

**Status:** planejamento concluído; estrutura inicial do aplicativo Expo em implementação na issue #01. Backend ainda não iniciado.

O **QuantoÉ** é um aplicativo mobile para proprietários de brechós, vendedores independentes e pequenos negócios de moda circular. Permite organizar peças em uma ou mais lojas, receber sugestões padronizadas de preço e acompanhar indicadores e alertas de estoque.

A precificação é **assistiva**: o aplicativo sugere um preço a partir de **marca, estado de conservação e estilo**, mas o proprietário define o preço final.

## Funcionalidades previstas

| Requisito | Funcionalidade |
| --- | --- |
| RF01 | Login por e-mail e senha |
| RF02 | Cadastro de usuário com foto opcional |
| RF03 | Cadastro e seleção de múltiplas lojas, com estoques separados |
| RF04 | Categorias próprias do usuário, com proteção contra exclusão quando utilizadas |
| RF05 | Marcas predefinidas e personalizadas, com classificação de valorização |
| RF06 | Cadastro, consulta e manutenção de peças e status |
| RF07 | Sugestão de preço e ajuste manual do preço final |
| RF08 | Alertas de peças paradas a partir da data de aquisição |
| RF09 | Alertas de baixo estoque por categoria |
| RF10 | Pesquisa e filtros combináveis do estoque |
| RF11 | Indicadores de quantidade, investimento, venda potencial e lucro potencial |

Consulte o documento de especificação de requisitos para as regras completas.

## Stack definida

| Camada | Tecnologia |
| --- | --- |
| Aplicativo mobile | React Native + Expo |
| Linguagem | TypeScript |
| API | Node.js + Fastify |
| Banco de dados | PostgreSQL |
| ORM | Prisma |
| Autenticação e armazenamento de arquivos | Supabase |
| Hospedagem da API | Vercel |
| Builds mobile | Expo EAS |
| Versionamento | Git + GitHub |

**Observação:** a arquitetura de deploy da API Fastify na Vercel deverá ser validada durante a implementação do backend. A stack está definida, mas não há serviços ou deploys configurados ainda.

## Estrutura planejada

```text
quantoe/
├── frontend/               # App Expo / React Native
│   ├── src/
│   │   ├── components/     # Componentes compartilhados
│   │   ├── features/       # Módulos funcionais (auth, stores, pieces...)
│   │   ├── navigation/     # Rotas e fluxo de navegação
│   │   ├── services/       # Interfaces e implementações de serviços
│   │   ├── mocks/          # Fixtures e serviços simulados
│   │   ├── theme/          # Tokens de cores, tipografia e espaçamento
│   │   ├── types/          # Tipos compartilhados no app
│   │   └── utils/          # Utilitários puros
│   └── assets/
├── backend/                # API Fastify (a implementar na milestone 06)
│   ├── src/
│   │   ├── modules/        # Domínios da API
│   │   ├── plugins/        # Plugins e infraestrutura Fastify
│   │   └── lib/            # Integrações e utilitários
│   └── prisma/             # Schema e migrations
├── docs/
│   ├── CONVENTIONS.md
│   └── MOCK_DATA.md
├── .gitignore
└── README.md
```

**Atenção:** esta é a estrutura alvo. O projeto Expo e as rotas iniciais já existem em `frontend/`; os demais módulos serão criados conforme as issues. A criação efetiva do backend ocorrerá na milestone 06.

## Estratégia de desenvolvimento

1. **Frontend (issues #01–#15):** desenvolver telas, navegação e interações com dados simulados.
2. **Backend (issues #16–#24):** implementar banco, autenticação, API e regras de negócio.
3. **Integração e testes (issues #25–#30):** substituir mocks pelos serviços reais, testar fluxos e preparar a primeira versão.

O projeto é acompanhado por **7 milestones e 30 issues** no GitHub. As issues definem o escopo e os critérios de aceite de cada entrega.

## Regras centrais de negócio

- Cada loja pertence a um usuário; o estoque de uma loja não deve aparecer em outra.
- Categorias são únicas por usuário e não podem ser excluídas quando vinculadas a peças.
- Marcas possuem uma classificação que determina sua pontuação; marcas personalizadas começam em **Desconhecida/Outra**, com possibilidade de reclassificação.
- Peças têm um dos status: **Livre**, **Reservada**, **Liquidação** ou **Vendida**.
- O índice de valorização soma exclusivamente os pontos de **marca + conservação + estilo**.
- O preço sugerido é `preço de aquisição × (1 + percentual de valorização)`; o preço final pode ser ajustado pelo usuário.
- Peças vendidas não entram nos indicadores do estoque ativo nem na contagem de baixo estoque.

As tabelas completas de pontuação, os exemplos e as regras dos mocks estão em [docs/MOCK_DATA.md](docs/MOCK_DATA.md).

## Como executar

O aplicativo inicial já pode ser executado com serviços simulados. Consulte também o [README do frontend](frontend/README.md) para o fluxo de demonstração e verificações.

```bash
cd frontend
npm install
npm run start
```

O backend terá instruções próprias após sua inicialização na milestone 06. Não é necessário executar PostgreSQL ou Supabase para desenvolver as primeiras telas com mocks.

## Convenções e documentação

- [Convenções de desenvolvimento](docs/CONVENTIONS.md): TypeScript, organização, Git, testes e segurança.
- [Modelos e dados simulados](docs/MOCK_DATA.md): contratos, fixtures, precificação e serviços mockados.

## Decisões ainda sujeitas a validação

- **Proposta de implementação:** preferências de estoque por loja, com valores iniciais de 90 dias para peças paradas e 5 unidades por categoria. A especificação exige configuração pelo usuário, mas não fixa esses valores nem o escopo por loja.
- **Proposta de implementação:** preços monetários em centavos inteiros nos contratos do aplicativo; formatação em reais na interface.
- **A validar:** política de senha, estratégia de sessão, permissões e upload de imagens, contratos HTTP e convenções de deploy.

## Licença

Ainda não definida. Não presumir licença de código aberto até que um arquivo `LICENSE` seja incluído.
