# Componentes compartilhados

Os componentes ficam em `src/components/`, usam os tokens de `src/theme/` e exibem textos em português brasileiro. Todos aceitam o tamanho de fonte configurado no dispositivo. Importe cada componente pelo caminho `@/components/<arquivo>`.

## Ações e campos

### `AppButton`

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `title` | `string` | obrigatório | Texto e nome acessível do botão. |
| `onPress` | `() => void \| Promise<void>` | obrigatório | Ação ao pressionar. |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Aparência da ação. |
| `disabled` | `boolean` | `false` | Impede interação. |
| `loading` | `boolean` | `false` | Exibe indicador e impede novos toques. |
| `size` | `'default' \| 'small'` | `'default'` | Altura visual; ambos preservam área de toque mínima de 48 dp. |
| `style` | `ViewStyle` | — | Estilo adicional do contêiner. |

### `AppTextField`

Aceita as propriedades de `TextInputProps` do React Native, além destas:

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `label` | `string` | obrigatório | Rótulo visível e nome acessível. |
| `helperText` | `string` | — | Orientação abaixo do campo. |
| `error` | `string` | — | Mensagem de erro; substitui a orientação e destaca a borda. |

Use `value` e `onChangeText` para campos controlados. `editable={false}` informa o estado desabilitado. O erro ou a orientação também é fornecido como dica de acessibilidade.

### `AppSelect`

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `label` | `string` | obrigatório | Rótulo visível e título do diálogo. |
| `options` | `{ label: string; value: string }[]` | obrigatório | Opções exibidas no diálogo. Os valores devem ser únicos. |
| `value` | `string` | — | Valor selecionado. |
| `onChange` | `(value: string) => void` | obrigatório | Recebe o valor escolhido. |
| `placeholder` | `string` | `'Selecione uma opção'` | Texto antes da escolha. |
| `error` | `string` | — | Mensagem de erro e borda destacada. |
| `disabled` | `boolean` | `false` | Impede abertura do diálogo. |
| `compact` | `boolean` | `false` | Reduz altura e tipografia do seletor para formulários compactos. |
| `searchable` | `boolean` | `false` | Mostra busca no diálogo, com comparação sem acentos. |

## Conteúdo e navegação

### `AppCard`

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `children` | `ReactNode` | obrigatório | Conteúdo do card. |
| `onPress` | `() => void` | — | Torna o card pressionável. |
| `accessibilityLabel` | `string` | — | Nome acessível; forneça quando o card for pressionável. |
| `selected` | `boolean` | `false` | Destaca o card selecionado. |
| `style` | `ViewStyle` | — | Estilo adicional do contêiner. |

### `AppHeader`

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `title` | `string` | obrigatório | Título da seção ou tela. |
| `subtitle` | `string` | — | Texto secundário. |
| `action` | `ReactNode` | — | Ação ao lado do título; quebra de linha em espaço reduzido. |

### `AppList` e `AppListItem`

| Componente | Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- | --- |
| `AppList` | `children` | `ReactNode` | obrigatório | Itens da lista. |
| `AppList` | `emptyMessage` | `string` | `'Nenhum item encontrado.'` | Título do estado vazio quando não houver filhos. |
| `AppListItem` | `title` | `string` | obrigatório | Texto principal. |
| `AppListItem` | `subtitle` | `string` | — | Texto secundário. |
| `AppListItem` | `trailing` | `ReactNode` | — | Conteúdo à direita. |
| `AppListItem` | `onPress` | `() => void` | — | Torna o item pressionável. |

Para listas extensas, use `FlatList` com `AppListItem` como item; `AppList` é adequado para conjuntos pequenos.

## Feedback e estados

### `AppFeedback`

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `variant` | `'success' \| 'error'` | obrigatório | Cor e significado do aviso. |
| `title` | `string` | obrigatório | Resumo do resultado. |
| `message` | `string` | — | Detalhe útil para a pessoa. |
| `actionLabel` | `string` | — | Texto da ação, exibida junto com `onAction`. |
| `onAction` | `() => void` | — | Ação, como tentar novamente. |
| `onDismiss` | `() => void` | — | Chamado ao fechar manualmente ou após 5 segundos. |
| `compact` | `boolean` | `false` | Reduz o aviso para uso em formulários e confirmações breves. |

Avisos de erro e sucesso desaparecem automaticamente após 5 segundos. O componente permanece no fluxo da tela enquanto está visível; use o espaçamento do contêiner para separá-lo dos demais elementos.

### `LoadingState`

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `message` | `string` | `'Carregando...'` | Descreve o que está sendo carregado. |

### `EmptyState`

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `title` | `string` | obrigatório | Explica a ausência de dados. |
| `message` | `string` | — | Complemento ou próximo passo. |
| `actionLabel` | `string` | — | Texto do botão, exibido junto com `onAction`. |
| `onAction` | `() => void` | — | Ação para resolver o estado vazio. |

Exemplo de fluxo de consulta:

```tsx
if (loading) return <LoadingState message="Carregando lojas..." />;
if (error) return <AppFeedback variant="error" title="Falha ao carregar" message={error} actionLabel="Tentar novamente" onAction={reload} />;
if (stores.length === 0) return <EmptyState title="Nenhuma loja encontrada" />;
```

## Diálogos

### `AppModal`

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `visible` | `boolean` | obrigatório | Controla a exibição. |
| `title` | `string` | obrigatório | Cabeçalho do diálogo. |
| `children` | `ReactNode` | obrigatório | Conteúdo. |
| `onClose` | `() => void` | obrigatório | Fecha pelo botão, fundo ou botão Voltar do Android. |

### `ConfirmDialog`

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `visible` | `boolean` | obrigatório | Controla a exibição. |
| `title` | `string` | obrigatório | Pergunta ou decisão. |
| `message` | `string` | obrigatório | Consequência da ação. |
| `confirmLabel` | `string` | `'Confirmar'` | Texto da confirmação. |
| `cancelLabel` | `string` | `'Cancelar'` | Texto do cancelamento. |
| `destructive` | `boolean` | `false` | Usa o estilo de ação destrutiva. |
| `loading` | `boolean` | `false` | Mostra progresso e bloqueia os botões. |
| `onConfirm` | `() => void \| Promise<void>` | obrigatório | Executa a ação confirmada. |
| `onCancel` | `() => void` | obrigatório | Fecha o diálogo. |

O diálogo limita a largura em telas grandes e empilha os botões quando a tela é estreita ou a fonte do sistema está ampliada.
