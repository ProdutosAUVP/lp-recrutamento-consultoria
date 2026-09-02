/**
 * AUVP Advisors — receptor do formulário da LP.
 *
 * Este arquivo NÃO roda no site: ele é colado no editor do Apps Script
 * vinculado à planilha de leads e publicado como Web App. A URL gerada na
 * publicação vai para FORM_ENDPOINT, no topo de assets/js/main.js.
 *
 * O passo a passo completo (criar, publicar, testar) está no README, na
 * seção "Planilha de leads".
 *
 * Duas coisas que parecem detalhe e não são:
 *
 * 1. A LP envia JSON com Content-Type: text/plain. Não é desleixo: com
 *    application/json o navegador dispara um preflight OPTIONS, e Web App
 *    de Apps Script não responde a OPTIONS. O envio morreria em CORS antes
 *    de chegar aqui. Por isso lemos e.postData.contents e damos o parse
 *    nós mesmos.
 *
 * 2. appendRow em endpoint público pede LockService. Dois envios no mesmo
 *    instante sem trava podem escrever na mesma linha e um sobrescrever o
 *    outro.
 */

/** Nome da aba que recebe os leads. Criada sozinha se não existir. */
var ABA = 'Leads';

/**
 * Ordem das colunas. A chave é o campo que a LP manda; o rótulo é o que
 * aparece no cabeçalho. Para acrescentar um campo novo, some-o aqui e no
 * formulário — as linhas antigas continuam válidas, só ficam vazias na
 * coluna nova.
 */
var COLUNAS = [
  ['recebidoEm',    'Recebido em'],
  ['nome',          'Nome'],
  ['whatsapp',      'WhatsApp'],
  ['email',         'E-mail'],
  ['registro',      'Registro na CVM'],
  ['experiencia',   'Tempo de atuação'],
  ['metodologias',  'Metodologias'],
  ['consentimento', 'Consentimento LGPD'],
  ['origem',        'Origem']
];

/**
 * Os selects mandam slugs. Traduzir aqui deixa a planilha legível para
 * quem vai trabalhar o lead, sem precisar decorar código.
 */
var ROTULOS = {
  registro: {
    'pf-autorizada':    'Pessoa física autorizada pela CVM',
    'pf-sem-registro':  'Pessoa física sem registro na CVM',
    'pj-autorizada':    'Pessoa jurídica autorizada pela CVM',
    'pj-sem-registro':  'Pessoa jurídica sem registro na CVM'
  },
  experiencia: {
    'menos-de-1': 'Menos de 1 ano',
    '1-3':        'De 1 a 3 anos',
    '3-5':        'De 3 a 5 anos',
    '5-10':       'De 5 a 10 anos',
    'mais-de-10': 'Mais de 10 anos'
  }
};

/** Abrir a URL no navegador cai aqui: serve para conferir se está no ar. */
function doGet() {
  return json({ ok: true, servico: 'AUVP Advisors — receptor de leads' });
}

function doPost(e) {
  var trava = LockService.getScriptLock();

  try {
    var dados = lerCorpo(e);

    // Armadilha anti-spam do formulário. Humano nenhum enxerga esse campo,
    // então preenchido significa robô. Responde ok para o robô não insistir,
    // mas não grava nada.
    if (dados.empresa_site) return json({ ok: true, ignorado: true });

    if (!dados.nome || !dados.email) {
      return json({ ok: false, erro: 'nome e email sao obrigatorios' }, 400);
    }

    trava.waitLock(20000);

    var aba = abaDeLeads();
    aba.appendRow(COLUNAS.map(function (col) {
      return valorDaColuna(col[0], dados);
    }));

    return json({ ok: true });
  } catch (erro) {
    // O erro vai para as Execuções do Apps Script, onde dá para investigar.
    console.error(erro);
    return json({ ok: false, erro: String(erro) }, 500);
  } finally {
    try { trava.releaseLock(); } catch (ignorado) {}
  }
}

/* ---------------------------------------------------------------- apoio */

function lerCorpo(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (naoEraJson) {
      // Cai aqui se alguém postar como formulário comum.
    }
  }
  return (e && e.parameter) || {};
}

function abaDeLeads() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(ABA) || planilha.insertSheet(ABA);

  // Cabeçalho na primeira execução, congelado para não sumir na rolagem.
  if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS.map(function (col) { return col[1]; }));
    aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
    aba.setFrozenRows(1);
  }
  return aba;
}

function valorDaColuna(chave, dados) {
  if (chave === 'recebidoEm') {
    // Carimbo do servidor, não do cliente: o relógio do visitante não é
    // confiável e o fuso dele, muito menos.
    return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
  }
  if (chave === 'consentimento') {
    return dados.consentimento === true || dados.consentimento === 'true' ? 'Sim' : 'Não';
  }

  var valor = dados[chave] == null ? '' : String(dados[chave]).trim();
  var mapa = ROTULOS[chave];
  return mapa && mapa[valor] ? mapa[valor] : valor;
}

function json(objeto, status) {
  // Apps Script não deixa definir status HTTP no ContentService: o código
  // vai no corpo e a LP trata qualquer resposta não-ok como falha de envio.
  if (status) objeto.status = status;
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
