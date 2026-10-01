# Teste de modelo

Protótipo para testar se dá para substituir a planilha por um site, sem perder
a flexibilidade. Não tem nada de energia solar aqui — é só um exemplo simples
de venda parcelada para validar três ideias.

## O que este projeto testa

1. **Variáveis com nome** em vez de endereço de célula.
   `custo_kit` em vez de `C35`. Pode reordenar os campos na lista: nada quebra.

2. **Override em qualquer campo calculado.**
   Digite por cima de qualquer valor. Ele fica amarelo, o resto recalcula em
   cascata, e o `↺` devolve a fórmula. Diferente do Excel, a fórmula não é
   perdida — fica anotada embaixo do campo.

3. **Rascunho de contas livres.**
   Uma conta por linha. `nome = conta` guarda o resultado para as linhas
   seguintes. Clicar no nome de um campo insere a variável no rascunho,
   igual clicar numa célula no Excel.

## Os arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | a estrutura da página |
| `style.css` | o visual |
| `modelo.js` | **as contas** — funções e campos. Não sabe que existe tela. |
| `app.js` | liga o modelo na tela |

A separação entre `modelo.js` e `app.js` é de propósito: o modelo pode ser
testado sozinho e, mais pra frente, levado para um servidor sem reescrever.

## Rodando no seu computador

Abra o `index.html` com dois cliques. É só isso — não precisa instalar nada
nem rodar servidor.

## Publicando no GitHub Pages

1. Em <https://github.com/new>, crie um repositório **público**.
   Dê um nome qualquer, por exemplo `teste-modelo`.

2. Na tela seguinte, clique em **uploading an existing file** e arraste os
   cinco arquivos. Clique em **Commit changes**.

3. No repositório, vá em **Settings → Pages**.
   Em *Source*, escolha **Deploy from a branch**.
   Em *Branch*, escolha **main** e a pasta **/ (root)**. Clique em **Save**.

4. Espere um ou dois minutos e recarregue a página. O endereço aparece no topo:
   `https://SEU-USUARIO.github.io/teste-modelo/`

Para editar depois sem sair do navegador: dentro do repositório, aperte a tecla
`.` — abre um VS Code completo na web. Salvou, commitou, o site atualiza sozinho.

## Mexendo no modelo

Tudo que importa está em `modelo.js`.

**Campo novo:** adicione uma linha na lista `CAMPOS`.

```js
{ nome: 'frete', rotulo: 'Frete', entrada: true, valor: 150, unidade: 'R$' },
{ nome: 'total_com_frete', rotulo: 'Total com frete', formula: 'total + frete' },
```

**Função nova:** adicione uma linha em `FUNCOES`.

```js
DOBRO: (x) => Number(x) * 2,
```

A ordem dos campos não importa — o cálculo faz passadas até os valores
pararem de mudar, então um campo pode usar outro declarado depois dele.

## Como escrever as contas

Igual na planilha em português:

| | |
|---|---|
| decimal | vírgula — `1,5` |
| separador de argumentos | ponto e vírgula — `SOMA(1; 2; 3)` |
| porcentagem | `10%` vira `0,10` |
| comentário no rascunho | linha começando com `#` |

Funções prontas: `SOMA` `MEDIA` `MAXIMO` `MINIMO` `ABS` `ARRED` `TETO` `PISO`
`RAIZ` `SE` `PGTO` `VPL` `TIR`

## Dependência

Só uma: [math.js](https://mathjs.org), carregada por CDN no `index.html`.
Ela faz a leitura das expressões do rascunho. O resto é JavaScript puro.
