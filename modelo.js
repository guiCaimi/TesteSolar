/* ===========================================================
   modelo.js  —  as contas.
   Este arquivo NÃO sabe que existe tela. Ele só define
   funções e campos. Quem desenha é o app.js.
   =========================================================== */


/* -----------------------------------------------------------
   1) Funções no estilo planilha, com nome em português.
   Para criar uma nova, basta adicionar uma linha aqui.
   ----------------------------------------------------------- */
const FUNCOES = {

  SOMA:   (...a) => a.flat().reduce((s, x) => s + Number(x), 0),
  MEDIA:  (...a) => FUNCOES.SOMA(...a) / a.flat().length,
  MAXIMO: (...a) => Math.max(...a.flat().map(Number)),
  MINIMO: (...a) => Math.min(...a.flat().map(Number)),
  ABS:    (x) => Math.abs(Number(x)),
  TETO:   (x) => Math.ceil(Number(x)),
  PISO:   (x) => Math.floor(Number(x)),
  RAIZ:   (x) => Math.sqrt(Number(x)),

  ARRED: (x, n) => {
    const f = Math.pow(10, n === undefined ? 0 : Number(n));
    return Math.round(Number(x) * f) / f;
  },

  SE: (condicao, seVerdadeiro, seFalso) => (condicao ? seVerdadeiro : seFalso),

  /* PGTO(taxa; nº de parcelas; valor presente) -> valor da parcela */
  PGTO: (taxa, n, vp) => {
    taxa = Number(taxa); n = Number(n); vp = Number(vp);
    if (taxa === 0) return vp / n;
    return vp * taxa / (1 - Math.pow(1 + taxa, -n));
  },

  /* VPL(taxa; fluxo1; fluxo2; ...) -> fluxos começam no período 1 */
  VPL: (taxa, ...fluxos) => {
    taxa = Number(taxa);
    return fluxos.flat().reduce(
      (s, f, i) => s + Number(f) / Math.pow(1 + taxa, i + 1), 0
    );
  },

  /* TIR(fluxo0; fluxo1; ...) -> o fluxo0 costuma ser negativo */
  TIR: (...fluxos) => {
    const f = fluxos.flat().map(Number);
    const vpl = (r) => f.reduce((s, v, i) => s + v / Math.pow(1 + r, i), 0);
    let lo = -0.9999, hi = 10;
    if (vpl(lo) * vpl(hi) > 0) return NaN;
    for (let i = 0; i < 300; i++) {
      const meio = (lo + hi) / 2;
      if (vpl(lo) * vpl(meio) <= 0) hi = meio; else lo = meio;
    }
    return (lo + hi) / 2;
  }
};


/* -----------------------------------------------------------
   2) Tradutor do jeito brasileiro de escrever.
        1,5         ->  1.5
        SOMA(1;2)   ->  SOMA(1,2)
        10%         ->  (10/100)
   ----------------------------------------------------------- */
function normalizar(expressao) {
  return String(expressao)
    .replace(/(\d)\s*,\s*(\d)/g, '$1.$2')
    .replace(/;/g, ',')
    .replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');
}


/* -----------------------------------------------------------
   3) O avaliador. Recebe um texto e as variáveis disponíveis.
   ----------------------------------------------------------- */
function avaliar(expressao, escopo) {
  return math.evaluate(normalizar(expressao), Object.assign({}, escopo, FUNCOES));
}


/* -----------------------------------------------------------
   4) Os campos do modelo.

      entrada: true  -> você digita o valor
      formula: '...' -> calculado, e aceita override

   Repare que cada campo tem NOME, não endereço de célula.
   Pode reordenar esta lista à vontade: nada quebra.
   ----------------------------------------------------------- */
const CAMPOS = [

  { nome: 'quantidade',     rotulo: 'Quantidade',        entrada: true, valor: 10,    unidade: 'un' },
  { nome: 'preco_unitario', rotulo: 'Preço unitário',    entrada: true, valor: 250,   unidade: 'R$' },
  { nome: 'desconto',       rotulo: 'Desconto',          entrada: true, valor: 0.10,  unidade: '0 a 1' },
  { nome: 'taxa_mensal',    rotulo: 'Taxa ao mês',       entrada: true, valor: 0.018, unidade: '0 a 1' },
  { nome: 'prazo',          rotulo: 'Prazo',             entrada: true, valor: 12,    unidade: 'meses' },

  { nome: 'subtotal',       rotulo: 'Subtotal',          formula: 'quantidade * preco_unitario' },
  { nome: 'valor_desconto', rotulo: 'Valor do desconto', formula: 'subtotal * desconto' },
  { nome: 'total',          rotulo: 'Total',             formula: 'subtotal - valor_desconto' },
  { nome: 'parcela',        rotulo: 'Parcela',           formula: 'PGTO(taxa_mensal; prazo; total)' },
  { nome: 'total_pago',     rotulo: 'Total pago',        formula: 'parcela * prazo' },
  { nome: 'juros',          rotulo: 'Juros do prazo',    formula: 'total_pago - total' },
  { nome: 'juros_pct',      rotulo: 'Juros sobre total', formula: 'juros / total' }
];


/* -----------------------------------------------------------
   5) O cálculo.

   Faz passadas até os valores pararem de mudar. Por isso a
   ORDEM dos campos acima não importa — um campo pode usar
   outro que está declarado depois dele.
   ----------------------------------------------------------- */
function calcularModelo() {
  const escopo = {};

  CAMPOS.forEach(c => {
    if (c.entrada) escopo[c.nome] = Number(c.valor);
  });

  for (let passada = 0; passada <= CAMPOS.length; passada++) {
    let mudou = false;

    CAMPOS.forEach(c => {
      if (c.entrada) return;

      let v;
      if (c.override !== null && c.override !== undefined) {
        v = Number(c.override);
      } else {
        try { v = avaliar(c.formula, escopo); }
        catch (e) { return; }           // depende de algo que ainda não existe
      }

      if (escopo[c.nome] !== v) { escopo[c.nome] = v; mudou = true; }
    });

    if (!mudou) break;
  }

  return escopo;
}


/* -----------------------------------------------------------
   6) O rascunho.

   Cada linha pode ser:
      uma conta solta          ->  230 * 400
      ou uma conta com nome    ->  dobro = total * 2

   Linhas com nome ficam disponíveis para as linhas seguintes.
   ----------------------------------------------------------- */
function calcularRascunho(texto, escopoBase) {
  const escopo = Object.assign({}, escopoBase);

  return String(texto).split('\n').map(linhaCrua => {
    const linha = linhaCrua.trim();
    if (!linha || linha.startsWith('#')) return { vazia: true };

    const atribuicao = linha.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);

    try {
      if (atribuicao) {
        const valor = avaliar(atribuicao[2], escopo);
        escopo[atribuicao[1]] = valor;
        return { nome: atribuicao[1], valor: valor };
      }
      return { valor: avaliar(linha, escopo) };
    } catch (e) {
      return { erro: true };
    }
  });
}


/* Para conseguir testar este arquivo fora do navegador. */
if (typeof module !== 'undefined') {
  module.exports = { FUNCOES, normalizar, avaliar, CAMPOS, calcularModelo, calcularRascunho };
}
