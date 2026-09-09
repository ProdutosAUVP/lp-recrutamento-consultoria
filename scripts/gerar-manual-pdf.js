/**
 * Gera o PDF do Manual de Registro na CVM a partir da fonte em HTML.
 *
 *   cd scripts && npm install && npm run manual
 *
 * Entrada:  docs/manual-registro-cvm/index.html
 * Saída:    docs/manual-registro-cvm/AUVP_Advisor_Manual_Registro_CVM_v1.pdf
 *
 * Três etapas:
 *   1. O Chromium (Playwright) imprime o HTML: cada .folha é uma página A4.
 *      Os links internos (sumário, cabeçalho) viram links do PDF e os
 *      títulos viram os marcadores (outline) do leitor.
 *   2. Antes de imprimir, o script lê a posição de todo elemento com
 *      `data-campo` na página: são as caixas, lacunas, quadradinhos e
 *      bolinhas do Kit e dos checklists.
 *   3. O pdf-lib abre o PDF impresso e cria, em cima de cada posição, um
 *      campo de formulário (texto, texto multilinha, caixa de seleção ou
 *      grupo de opções), com o texto-modelo já preenchido onde houver.
 *
 * A página carrega a Satoshi da Fontshare, como o site; sem rede para a
 * fundição, o Chromium usa a Figtree local (docs/manual-registro-cvm/fonts),
 * declarada como fallback no próprio HTML. O texto digitado nos campos usa
 * a Helvetica do leitor de PDF.
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

let chromium, pdfLib;
try {
  ({ chromium } = require("playwright"));
  pdfLib = require("pdf-lib");
} catch (erro) {
  console.error("Dependências ausentes. Rode `npm install` dentro de scripts/ (e `npx playwright install chromium`).");
  process.exit(1);
}
const { PDFDocument, StandardFonts, rgb } = pdfLib;

const RAIZ = path.resolve(__dirname, "..", "docs", "manual-registro-cvm");
const ENTRADA = path.join(RAIZ, "index.html");
const SAIDA = path.join(RAIZ, "AUVP_Advisor_Manual_Registro_CVM_v1.pdf");

// Tinta e borda dos campos, nos tokens da superfície clara do manual.
const TINTA = rgb(0x14 / 255, 0x16 / 255, 0x1a / 255);
const BORDA = rgb(0xc4 / 255, 0xc0 / 255, 0xb8 / 255);
const BRANCO = rgb(1, 1, 1);

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  // `networkidle` espera as fontes remotas; se a fundição não responder, o
  // fallback local entra e o PDF sai do mesmo jeito.
  await pagina.goto(pathToFileURL(ENTRADA).href, { waitUntil: "networkidle", timeout: 60000 });
  await pagina.emulateMedia({ media: "print" });
  await pagina.evaluate(() => document.fonts.ready);

  // Cada .folha é uma página A4 com overflow escondido: o que passar da
  // altura some sem aviso, então o script confere antes de imprimir.
  const estouros = await pagina.evaluate(() =>
    Array.from(document.querySelectorAll(".folha"))
      .filter((f) => f.scrollHeight > f.clientHeight + 1)
      .map((f) => `${f.id || f.getAttribute("aria-label") || "folha"} (+${f.scrollHeight - f.clientHeight}px)`)
  );
  if (estouros.length) {
    console.warn(`Atenção: conteúdo estourando a folha em: ${estouros.join(", ")}`);
  }

  const fontes = await pagina.evaluate(() =>
    Array.from(document.fonts).filter((f) => f.status === "loaded").map((f) => f.family)
  );
  const familia = fontes.includes("Satoshi") ? "Satoshi" : fontes.includes("Figtree") ? "Figtree (fallback)" : "fonte de sistema";

  // Posição de cada campo, em fração da folha (independe de px/pt/mm).
  const campos = await pagina.evaluate(() => {
    const folhas = Array.from(document.querySelectorAll(".folha"));
    return Array.from(document.querySelectorAll("[data-campo]")).map((el) => {
      const folha = el.closest(".folha");
      const f = folha.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        nome: el.dataset.campo,
        tipo: el.dataset.tipo || "texto",
        valor: el.dataset.valor || "",
        texto: el.classList.contains("caixa--texto") ? el.textContent.trim() : "",
        pagina: folhas.indexOf(folha),
        x: (r.left - f.left) / f.width,
        y: (r.top - f.top) / f.height,
        w: r.width / f.width,
        h: r.height / f.height,
      };
    });
  });

  // Títulos dos marcadores, na ordem do documento. O Chromium monta o outline
  // a partir dos h1–h3, mas cola as linhas de um título quebrado sem espaço
  // ("Registrona CVM"); o texto do HTML corrige isso logo abaixo.
  const titulos = await pagina.evaluate(() =>
    Array.from(document.querySelectorAll("h1, h2, h3")).map((t) => t.textContent.replace(/\s+/g, " ").trim())
  );

  const impresso = await pagina.pdf({
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: false,
    outline: true,
    tagged: true,
  });
  await navegador.close();

  // ---- Campos de formulário ----
  const doc = await PDFDocument.load(impresso);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();
  const grupos = new Map();
  let total = 0;

  for (const c of campos) {
    const page = doc.getPage(c.pagina);
    const { width: W, height: H } = page.getSize();
    // pdf-lib mede da borda inferior; o navegador, da superior.
    const caixa = { x: c.x * W, y: H - (c.y + c.h) * H, width: c.w * W, height: c.h * H };

    if (c.tipo === "check") {
      const campo = form.createCheckBox(c.nome);
      campo.addToPage(page, { ...caixa, borderWidth: 1, borderColor: BORDA, backgroundColor: BRANCO });
      total += 1;
    } else if (c.tipo === "radio") {
      let grupo = grupos.get(c.nome);
      if (!grupo) {
        grupo = form.createRadioGroup(c.nome);
        grupos.set(c.nome, grupo);
        total += 1;
      }
      grupo.addOptionToPage(c.valor, page, { ...caixa, borderWidth: 1, borderColor: BORDA, backgroundColor: BRANCO });
    } else {
      const campo = form.createTextField(c.nome);
      const multilinha = c.tipo === "multilinha";
      if (multilinha) campo.enableMultiline();
      // As lacunas dos modelos são só uma linha: o campo fica logo acima dela.
      const lacuna = c.h * H < 14;
      campo.addToPage(page, {
        x: caixa.x,
        y: caixa.y + 1,
        width: caixa.width,
        height: lacuna ? caixa.height + 2 : caixa.height - 2,
        borderWidth: 0,
        backgroundColor: c.texto ? BRANCO : undefined,
        textColor: TINTA,
        font: helv,
      });
      // O tamanho da fonte só pode ser definido depois que o widget existe (é
      // ele que carrega a aparência-padrão do campo).
      campo.setFontSize(multilinha ? 9 : 9.5);
      if (c.texto) campo.setText(c.texto);
      total += 1;
    }
  }
  form.updateFieldAppearances(helv);

  // ---- Marcadores: reescreve os títulos com o texto do HTML ----
  const { PDFName, PDFDict, PDFHexString } = pdfLib;
  const itens = [];
  const percorrer = (ref) => {
    while (ref) {
      const item = doc.context.lookup(ref, PDFDict);
      itens.push(item);
      const primeiro = item.get(PDFName.of("First"));
      if (primeiro) percorrer(primeiro);
      ref = item.get(PDFName.of("Next"));
    }
  };
  const outlines = doc.catalog.get(PDFName.of("Outlines"));
  if (outlines) percorrer(doc.context.lookup(outlines, PDFDict).get(PDFName.of("First")));
  if (itens.length && itens.length === titulos.length) {
    itens.forEach((item, i) => item.set(PDFName.of("Title"), PDFHexString.fromText(titulos[i])));
  } else {
    console.warn(`Atenção: marcadores (${itens.length}) e títulos do HTML (${titulos.length}) não batem; títulos mantidos como o Chromium gerou.`);
  }

  doc.setTitle("Manual de Registro na CVM | AUVP Advisor");
  doc.setAuthor("AUVP Advisor");
  doc.setSubject("Como se registrar como Consultor de Valores Mobiliários: um guia do zero ao protocolo, para Pessoa Física e Pessoa Jurídica.");
  doc.setLanguage("pt-BR");
  doc.setProducer("Chromium + pdf-lib");
  doc.setCreator("AUVP Advisor · scripts/gerar-manual-pdf.js");

  fs.writeFileSync(SAIDA, await doc.save());
  console.log(`PDF gerado em ${path.relative(process.cwd(), SAIDA)} · ${doc.getPageCount()} páginas · ${total} campos · tipografia: ${familia}`);
})().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
