/* ===========================================================
   app.js  —  liga o modelo na tela.
   Toda a matemática está em modelo.js. Aqui só tem interface.
   =========================================================== */

const els = {};                                   // nome do campo -> elementos na tela

/* Valores a partir de 1 saem com 2 casas; abaixo de 1 saem com até 6,
   para que taxas como 0,018 não virem 0,02 na tela. */
const fmtGrande  = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPequeno = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 6 });

function formatar(v) {
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '—';
    return (v !== 0 && Math.abs(v) < 1) ? fmtPequeno.format(v) : fmtGrande.format(v);
  }
  if (typeof v === 'boolean') return v ? 'verdadeiro' : 'falso';
  if (v === null || v === undefined) return '—';
  return String(v);
}

/* Aceita "1.234,56" e também "0.018". */
function lerNumero(txt) {
  let t = String(txt).trim();
  if (t === '') return null;
  if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}


/* -----------------------------------------------------------
   Monta a tela uma única vez.
   ----------------------------------------------------------- */
function montar() {
  const painelEntradas  = document.getElementById('entradas');
  const painelCalculados = document.getElementById('calculados');

  CAMPOS.forEach(campo => {
    const linha = document.createElement('div');
    linha.className = 'campo';

    const rotulo = document.createElement('button');
    rotulo.type = 'button';
    rotulo.className = 'rotulo';
    rotulo.textContent = campo.rotulo;
    rotulo.title = 'Clique para inserir "' + campo.nome + '" no rascunho';
    rotulo.addEventListener('click', () => inserirNoRascunho(campo.nome));

    const input = document.createElement('input');
    input.className = 'valor';
    input.inputMode = 'decimal';

    const unidade = document.createElement('span');
    unidade.className = 'unidade';
    unidade.textContent = campo.unidade || '';

    linha.append(rotulo, input, unidade);

    if (campo.entrada) {
      input.addEventListener('input', () => {
        const n = lerNumero(input.value);
        if (n !== null) { campo.valor = n; atualizar(); }
      });
      painelEntradas.append(linha);
      els[campo.nome] = { input, linha };

    } else {
      const voltar = document.createElement('button');
      voltar.type = 'button';
      voltar.className = 'voltar';
      voltar.textContent = '↺';
      voltar.title = 'Voltar ao valor calculado';
      voltar.addEventListener('click', () => {
        campo.override = null;
        atualizar(true);
      });

      const nota = document.createElement('div');
      nota.className = 'nota';

      input.addEventListener('input', () => {
        campo.override = input.value.trim() === '' ? null : lerNumero(input.value);
        atualizar();
      });

      linha.append(voltar, nota);
      painelCalculados.append(linha);
      els[campo.nome] = { input, linha, nota };
    }
  });

  document.getElementById('rascunho').addEventListener('input', () => atualizar());

  document.getElementById('lista-funcoes').textContent =
    Object.keys(FUNCOES).sort().join('  ·  ');
}


/* -----------------------------------------------------------
   Recalcula tudo e escreve os valores na tela.
   ----------------------------------------------------------- */
function atualizar(reescreverTudo) {
  const escopo = calcularModelo();

  CAMPOS.forEach(campo => {
    const el = els[campo.nome];
    if (!el) return;

    const valor = escopo[campo.nome];
    const digitando = document.activeElement === el.input;

    if (campo.entrada) {
      if (!digitando) el.input.value = formatar(valor);
      return;
    }

    const forcado = campo.override !== null && campo.override !== undefined;
    el.linha.classList.toggle('forcado', forcado);

    if (!digitando || reescreverTudo) el.input.value = formatar(valor);

    let peloCalculo = '—';
    try { peloCalculo = formatar(avaliar(campo.formula, escopo)); } catch (e) {}

    el.nota.textContent = forcado
      ? '= ' + campo.formula + '   →   sem o override daria ' + peloCalculo
      : '= ' + campo.formula;
  });

  atualizarRascunho(escopo);
}


function atualizarRascunho(escopo) {
  const linhas = calcularRascunho(document.getElementById('rascunho').value, escopo);
  const saida = document.getElementById('resultados');
  saida.innerHTML = '';

  linhas.forEach(r => {
    const div = document.createElement('div');
    div.className = 'res' + (r.erro ? ' erro' : '') + (r.vazia ? ' vazia' : '');
    div.textContent = r.vazia ? '·' : (r.erro ? 'erro' : formatar(r.valor));
    saida.append(div);
  });
}


/* -----------------------------------------------------------
   Clicar num campo insere o nome dele no rascunho,
   na posição onde o cursor estava.
   ----------------------------------------------------------- */
function inserirNoRascunho(nome) {
  const ta = document.getElementById('rascunho');
  const inicio = ta.selectionStart;
  const fim = ta.selectionEnd;
  const antes = ta.value.slice(0, inicio);
  const depois = ta.value.slice(fim);

  const precisaEspaco = antes.length > 0 && !/[\s(;+\-*/=]$/.test(antes);
  const texto = (precisaEspaco ? ' ' : '') + nome;

  ta.value = antes + texto + depois;
  const posicao = inicio + texto.length;
  ta.focus();
  ta.setSelectionRange(posicao, posicao);
  atualizar();
}


/* -----------------------------------------------------------
   Começo.
   ----------------------------------------------------------- */
montar();

document.getElementById('rascunho').value =
  '# Clique nos nomes dos campos acima para inserir aqui\n' +
  'total * 2\n' +
  'dobro = total * 2\n' +
  'dobro - valor_desconto\n' +
  'PGTO(2%; 24; dobro)';

atualizar(true);
