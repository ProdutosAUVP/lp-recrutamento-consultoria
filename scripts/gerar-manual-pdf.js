/**
 * Gera o PDF do Manual de Registro na CVM a partir da fonte em HTML.
 *
 *   node scripts/gerar-manual-pdf.js
 *
 * Entrada:  docs/manual-registro-cvm/index.html
 * Saída:    docs/manual-registro-cvm/AUVP_Advisor_Manual_Registro_CVM_v1.pdf
 *
 * Precisa do Playwright com o Chromium (`npm i -g playwright` e
 * `npx playwright install chromium`, ou o pacote já instalado no ambiente).
 * A página carrega a Satoshi da Fontshare, como o site; sem rede para a
 * fundição, o Chromium usa a Figtree local (docs/manual-registro-cvm/fonts),
 * que está declarada como fallback no próprio HTML.
 */
const path = require("path");
const { pathToFileURL } = require("url");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (erro) {
  console.error("Playwright não encontrado. Instale com: npm i -g playwright && npx playwright install chromium");
  process.exit(1);
}

const RAIZ = path.resolve(__dirname, "..", "docs", "manual-registro-cvm");
const ENTRADA = path.join(RAIZ, "index.html");
const SAIDA = path.join(RAIZ, "AUVP_Advisor_Manual_Registro_CVM_v1.pdf");

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

  await pagina.pdf({
    path: SAIDA,
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: false,
  });
  await navegador.close();

  console.log(`PDF gerado em ${path.relative(process.cwd(), SAIDA)} · tipografia: ${familia}`);
})().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
